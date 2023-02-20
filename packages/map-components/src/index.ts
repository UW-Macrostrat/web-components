import React, { createElement, useRef, useCallback, useReducer, useEffect, useMemo } from "react";
import { addClassNames } from "@macrostrat/hyper";
import h from "./hyper";
import {
  useMap,
  MapContext,
  RotationAngles,
  GlobeActions,
  GlobeState,
  globeReducer,
  MapDispatchContext,
  GeoPath,
} from "./context";
import { useGraticule, Graticule } from "./graticule";
import { DraggableOverlay } from "./drag-interaction";
import { geoOrthographic, geoGraticule, geoPath, GeoProjection } from "d3-geo";
import styles from "./main.module.styl";

type Coord = [number, number];

function Background(props) {
  return h(GeoPath, {
    geometry: { type: "Sphere" },
    className: "background",
    ...props,
  });
}

function Sphere(props) {
  const newProps = addClassNames(props, "neatline");
  return h(GeoPath, {
    geometry: { type: "Sphere" },
    ...newProps,
  });
}

/*


type MutateProjection = (p: GeoProjection, opts: ProjectionParams) => GeoProjection;

const mutateProjection: MutateProjection = (projection, opts) => {
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
*/

/* This function is currently unused, but it helps propagate mouse events upwards
function dispatchEvent(evt) {
  const v: HTMLElement = ref.current;
  if (v == null) return;
  const el = v.getElementsByClassName(styles.map)[0];
  // Simulate an event directly on the map's DOM element
  const { clientX, clientY } = evt;

  const e1 = new MouseEvent("mousedown", { clientX, clientY });
  const e2 = new MouseEvent("mouseup", { clientX, clientY });

  el.dispatchEvent(e1);
  el.dispatchEvent(e2);
}
*/

interface ProjectionParams {
  center?: Coord;
  translate?: Coord;
  width: number;
  height: number;
  scale: number;
  margin: number;
  rotation?: RotationAngles;
}

const defaultProps = {
  keepNorthUp: false,
  allowDrag: true,
  allowZoom: false,
  center: [0, 0],
  graticule: Graticule,
  projection: geoOrthographic().clipAngle(90).precision(0.5),
};

interface GlobeProps extends ProjectionParams {
  [key: string]: any;
  projection: GeoProjection;
  keepNorthUp: boolean;
  allowDrag: boolean;
  allowZoom: boolean;
  onRotate?(v: RotationAngles): void;
  children?: React.ReactNode;
  zoomScaleExtent?: [number, number];
  graticuleSpacing?: number;
}

export function Globe(_props: GlobeProps) {
  const props = { ...defaultProps, ..._props };

  let {
    children,
    keepNorthUp,
    allowDrag,
    allowZoom,
    scale,
    center,
    graticule,
    onRotate,
    zoomScaleExtent,
    graticuleSpacing = 10,
  } = props;
  const { width: outerWidth, height: outerHeight, margin = 80, translate, ...rest } = props;

  const [mapState, dispatch] = useReducer(globeReducer, {
    projection: props.projection,
    zoom: 1,
    canvasContexts: new Set([]),
    updateCount: 0,
  });

  const actionHandler = useCallback(
    (action: GlobeActions) => {
      if (action.type === "rotate") {
        onRotate?.(action.rotation);
      }
      dispatch(action);
    },
    [dispatch, onRotate]
  );

  const { projection } = mapState;
  const initialScale = scale || projection.scale() || 500;

  const ref = useRef<HTMLElement>(null);
  const mapElement = useRef<HTMLElement>(null);

  const width = outerWidth - 2 * margin;
  const height = outerHeight - 2 * margin;

  //const actions = createActions(ref, actionHandler);

  useEffect(() => {
    const rotation: [number, number] = [-center[0], -center[1]];
    dispatch({ type: "rotate", rotation });
  }, [center]);

  useEffect(() => {
    const trans = translate ?? [width / 2, height / 2];
    const newProj = projection
      .translate(trans)
      .scale(scale)
      .clipExtent([
        [0, 0],
        [width, height],
      ]);
    dispatch({ type: "update", projection: newProj });
  }, [props.projection, width, height, margin, translate, scale]);

  const renderPath = useMemo(() => geoPath(mapState.projection), [mapState.projection]); //, [mapState.projection]);
  const value = { projection, renderPath, width, height, margin };

  const xmlns = "http://www.w3.org/2000/svg";
  const viewBox = `0 0 ${outerWidth} ${outerHeight}`;

  useEffect(() => {
    const newProj = projection.scale(scale);
    dispatch({ type: "update", projection: newProj });
  }, [scale]);

  return h(
    MapContext.Provider,
    { value },
    h(
      MapDispatchContext.Provider,
      { value: actionHandler },
      createElement(
        "svg",
        {
          className: "macrostrat-map globe",
          ref,
          xmlns,
          width: outerWidth,
          height: outerWidth,
          viewBox,
        },
        [
          h("g.map", { ref: mapElement, transform: `translate(${margin} ${margin})` }, [
            h(Background),
            h(graticule, { stepSize: graticuleSpacing }),
            children,
            h(Sphere),
          ]),
          h.if(allowDrag)(DraggableOverlay, {
            keepNorthUp,
            initialScale,
            dragSensitivity: 0.1,
            allowZoom,
            scaleExtent: zoomScaleExtent,
          }),
        ]
      )
    )
  );
}

export * from "./axis-labels";
export { MapContext, useMap };
export * from "./canvas-layer";
export * from "./feature";
export * from "./base-layers";
