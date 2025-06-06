import { Component } from "react";
import { findDOMNode } from "react-dom";
import h from "./hyper";
import { GlobeCtx, MapContext, useMapDispatch } from "./context";
import { drag, DragBehavior } from "d3-drag";
import { zoom, ZoomBehavior } from "d3-zoom";
import { select, pointer } from "d3-selection";
import {
  sph2cart,
  quat2euler,
  euler2quat,
  quatMultiply,
  quaternion,
} from "./math";
import { useMapRef } from "./context";

interface DraggableOverlayProps {
  scaleExtent?: [number, number];
  showMousePosition?: boolean;
  initialScale?: number;
  keepNorthUp?: boolean;
  allowZoom?: boolean;
  dragSensitivity?: number;
}

interface DraggableOverlayInternalProps extends DraggableOverlayProps {
  dispatch(action: any): void;
  mapRef: React.RefObject<SVGElement>;
}

class _DraggableOverlay extends Component<DraggableOverlayInternalProps, any> {
  static contextType = MapContext;
  context: GlobeCtx;

  static defaultProps = {
    showMousePosition: false,
    allowZoom: true,
    keepNorthUp: false,
    dragSensitivity: 1,
  };
  zoomHandler: ZoomBehavior<any, any> | null;
  drag: DragBehavior<any, any, any>;
  r0: number[];
  p0: number[];
  qa: number[];
  q0: number[];
  zoom: number;

  constructor(props) {
    super(props);
    this.dragStarted = this.dragStarted.bind(this);
    this.dragged = this.dragged.bind(this);
    this.dragEnded = this.dragEnded.bind(this);
    this.zoomed = this.zoomed.bind(this);
    this.element = this.element.bind(this);
    this.updateZoom = this.updateZoom.bind(this);
    this.getScaleExtent = this.getScaleExtent.bind(this);
    this.state = { mousePosition: null };
    this.zoom = null;
  }
  render() {
    // https://medium.com/dev-shack/clicking-and-dragging-svg-with-react-and-d3-js-5639cd0c3c3b
    const { width, height, renderPath } = this.context;
    const { showMousePosition } = this.props;
    const { mousePosition } = this.state;
    return h("g.drag-overlay", [
      h("rect.drag-mouse-target", { width, height }),
      h.if(mousePosition != null && showMousePosition)("path.mouse-position", {
        d: renderPath(mousePosition),
      }),
    ]);
  }

  dragStarted(mousePos) {
    const { projection } = this.context;
    const pos = projection.invert(mousePos);
    this.setState({ mousePosition: { type: "Point", coordinates: pos } });
    this.r0 = projection.rotate();
    this.p0 = sph2cart(pos);
    this.qa = euler2quat(this.r0);
    this.q0 = euler2quat(this.r0);
  }

  dragged(mousePos, evt) {
    const { keepNorthUp, dragSensitivity: sens } = this.props;
    const { projection } = this.context;
    const rot = projection.rotate();
    this.q0 = euler2quat(rot);
    const pos = projection.invert(mousePos);
    const q1 = quaternion(this.p0, sph2cart(pos));
    const res = quatMultiply(this.q0, q1);
    let r1 = quat2euler(res);
    // keeping north up basically doesn't workq
    if (keepNorthUp) {
      // A completely different rotation strategy
      r1 = [evt.x * sens, -evt.y * sens, rot[2]];
    }
    if (r1 == null) {
      return;
    }
    this.props.dispatch({ type: "rotate", rotation: r1 });
  }

  dragEnded() {
    return this.setState({ mousePosition: null });
  }

  zoomed(event) {
    const scale = event?.transform.k;
    if (scale == null) {
      return;
    }
    this.props.dispatch({ type: "scale", scale });
  }

  element() {
    // This is a hack but it seems to work!
    return select(findDOMNode(this).parentElement);
  }

  componentDidMount() {
    const { width, height, projection, dispatchEvent } = this.context;
    const { dragSensitivity: sens } = this.props;

    const forwardMousePos = (func) =>
      function (event) {
        return func(pointer(event), event);
      };

    const eventSubject = function (d) {
      // for d3 events to report x and y in terms of rotation
      const r = projection.rotate();
      return {
        x: r[0] / sens,
        y: -r[1] / sens,
      };
    };

    const el = this.element();
    this.drag = drag()
      .clickDistance(2)
      .subject(eventSubject)
      .on("start", forwardMousePos(this.dragStarted))
      .on("drag", forwardMousePos(this.dragged))
      .on("end", this.dragEnded);
    this.drag(el);

    if (this.props.allowZoom) {
      this.setupZoom();
    }
  }

  setupZoom() {
    const el = this.element();
    // Zoom over one order of magnitude by default

    const zoomHandler = this.zoomed.bind(this);

    this.zoomHandler = zoom().on("zoom", zoomHandler).on("end", zoomHandler);
    this.zoomHandler(el);
    this.updateZoom();
  }

  updateZoom(scale?: number) {
    const el = this.element();
    scale ??= this.props.initialScale;
    this.zoomHandler?.scaleExtent(this.getScaleExtent()).scaleTo(el, scale);
  }

  getScaleExtent(): [number, number] {
    const { initialScale, scaleExtent } = this.props;
    if (scaleExtent != null) {
      return scaleExtent;
    }
    return [initialScale * 0.8, initialScale * 2];
  }

  componentDidUpdate(prevProps) {
    const el = this.element();
    const { initialScale } = this.props;
    if (initialScale === prevProps.initialScale) {
      return;
    }
    if (this.zoomHandler != null) {
      // @ts-ignore
      return this.updateZoom();
    }
  }
}

export function DraggableOverlay(props: DraggableOverlayProps) {
  const dispatch = useMapDispatch();
  const mapRef = useMapRef();
  return h(_DraggableOverlay, { ...props, dispatch, mapRef });
}
