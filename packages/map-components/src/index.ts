import React, { Component, useContext, createRef, createElement } from "react";
import { findDOMNode } from "react-dom";
import { addClassNames } from "@macrostrat/hyper";
import { StatefulComponent } from "@macrostrat/ui-components";
import h from "./hyper";
import { MapContext } from "./context";
import { DraggableOverlay } from "./drag-interaction";
import { geoOrthographic, geoGraticule, geoPath, GeoProjection } from "d3-geo";
import styles from "./main.module.styl";

type Coord = [number, number];

function GeoPath(props) {
  const { geometry, ...rest } = props;
  const { renderPath } = useContext<any>(MapContext);
  const d = geometry != null ? renderPath(geometry) : null;
  return h("path", { d, ...rest });
}

class Background extends Component {
  static contextType = MapContext;
  render() {
    return h(GeoPath, {
      geometry: { type: "Sphere" },
      className: "background",
      ...this.props,
    });
  }
}

const Graticule = function (props) {
  const graticule = geoGraticule()
    .step([10, 10])
    .extent([
      [-180, -80],
      [180, 80 + 1e-6],
    ]);
  return h(GeoPath, {
    className: "graticule",
    geometry: graticule(),
    ...props,
  });
};

function Sphere(props) {
  const newProps = addClassNames(props, "neatline");
  return h(GeoPath, {
    geometry: { type: "Sphere" },
    ...newProps,
  });
}

type RotationAngles = [number, number, number] | [number, number];

interface ProjectionParams {
  center?: Coord;
  translate?: Coord;
  width: number;
  height: number;
  scale: number;
  margin: number;
  rotation?: RotationAngles;
}

type MutateProjection = (p: GeoProjection, opts: ProjectionParams) => GeoProjection;

interface GlobeProps extends ProjectionParams {
  [key: string]: any;
  projection: GeoProjection;
  keepNorthUp: boolean;
  allowDrag: boolean;
  allowZoom: boolean;
  setupProjection: MutateProjection;
  onRotate?(v: RotationAngles): void;
}

const mutateProjection: MutateProjection = (projection, opts) => {
  /** Function to update a projection with new parameters */
  const { width, height, center = projection.center() } = opts;
  const margin = opts.margin ?? 0;
  let { scale, translate } = opts;
  scale = opts.scale ?? projection.scale();
  if (scale == null) {
    const maxSize = Math.min(width, height);
    scale = maxSize / 2;
  }
  if (translate == null) {
    translate = [width / 2, height / 2];
  }
  const rotation = opts.rotation ?? [-center[0], -center[1]];

  // We disabled direct setting of projection center
  return projection
    .scale(scale)
    .translate(translate)
    .rotate(rotation)
    .clipExtent([
      [margin, margin],
      [width - margin, height - margin],
    ]);
};

class Globe extends StatefulComponent<GlobeProps, any> {
  static defaultProps = {
    keepNorthUp: false,
    allowDrag: true,
    allowZoom: false,
    center: [0, 0],
    graticule: Graticule,
    projection: geoOrthographic().clipAngle(90).precision(0.5),
    setupProjection: mutateProjection,
  };

  mapElement: React.RefObject<HTMLElement>;

  constructor(props) {
    super(props);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    this.updateProjection = this.updateProjection.bind(this);
    this.rotateProjection = this.rotateProjection.bind(this);
    this.dispatchEvent = this.dispatchEvent.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.resetProjection = this.resetProjection.bind(this);

    this.mapElement = createRef();

    const { projection, setupProjection, ...rest } = this.props;

    this.state = {
      projection: setupProjection(projection, rest),
      zoom: 1,
      canvasContexts: new Set([]),
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const { width, height, scale, translate, setupProjection } = this.props;
    const sameDimensions = prevProps.width === width && prevProps.height === height;
    const sameProjection = prevProps.projection === this.props.projection;

    let center = this.props.center;
    if (center == prevProps.center) {
      center = this.state.projection.center();
    }
    const sameScale =
      prevProps.scale === scale &&
      prevProps.translate === translate &&
      prevProps.center === this.props.center;
    if (sameDimensions && sameProjection && sameScale) {
      return;
    }

    const newProj = setupProjection(this.state.projection, { ...this.props, center });

    return this.updateProjection(newProj);
  }

  resetProjection(projection) {
    const { setupProjection, ...rest } = this.props;
    return this.updateProjection(setupProjection(projection, this.props));
  }

  updateProjection(newProj) {
    return this.updateState({ projection: { $set: newProj } });
  }

  rotateProjection(rotation) {
    this.props.onRotate?.(rotation);
    if (this.props.rotation != null) return;
    const newProj = this.props.setupProjection(this.state.projection, {
      ...this.props,
      rotation,
    });
    return this.updateProjection(newProj);
  }

  dispatchEvent(evt) {
    const v = findDOMNode(this) as HTMLElement;
    const el = v.getElementsByClassName(styles.map)[0];
    // Simulate an event directly on the map's DOM element
    const { clientX, clientY } = evt;

    const e1 = new Event("mousedown", { clientX, clientY });
    const e2 = new Event("mouseup", { clientX, clientY });

    el.dispatchEvent(e1);
    return el.dispatchEvent(e2);
  }

  componentDidMount() {
    return this.componentDidUpdate.call(this, arguments);
  }

  render() {
    let { width, height, children, keepNorthUp, allowDrag, allowZoom, scale, center, graticule } =
      this.props;
    const { projection } = this.state;
    const initialScale = scale || projection.scale() || 500;

    const actions = {
      rotateProjection: this.rotateProjection,
      updateProjection: this.updateProjection,
      updateState: this.updateState,
      dispatchEvent: this.dispatchEvent,
    };

    const renderPath = geoPath(projection);
    const value = { projection, renderPath, width, height, ...actions };

    const margin = 80;

    const xmlns = "http://www.w3.org/2000/svg";
    const viewBox = `0 0 ${width} ${height}`;

    return h(
      MapContext.Provider,
      { value },
      createElement(
        "svg",
        {
          className: "macrostrat-map globe",
          xmlns,
          width,
          height,
          viewBox,
        },
        [
          h("g.map", { ref: this.mapElement }, [h(Background), h(graticule), children, h(Sphere)]),
          h.if(allowDrag)(DraggableOverlay, {
            keepNorthUp,
            initialScale,
            dragSensitivity: 0.1,
            allowZoom,
          }),
        ]
      )
    );
  }
}

export { Globe, MapContext };
export * from "./canvas-layer";
export * from "./feature";
