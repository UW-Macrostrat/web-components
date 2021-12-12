import React, { Component, useContext, createElement, useRef, useState, useReducer } from "react";
import { addClassNames } from "@macrostrat/hyper";
import h from "./hyper";
import { MapContext } from "./context";
import { DraggableOverlay } from "./drag-interaction";
import { geoOrthographic, geoGraticule, geoPath, GeoProjection } from "d3-geo";
import styles from "./main.module.styl";
import { useComponentDidUpdate } from "@macrostrat/ui-components";

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

type GlobeState = {
  projection: GeoProjection;
  zoom: number;
  canvasContexts: Set<CanvasRenderingContext2D[]>;
  updateCount: number;
};

type UpdateProjection = { type: "update"; projection: GeoProjection };
type RotateProjection = { type: "rotate"; rotation: RotationAngles };
type UpdateState = { type: "update-state"; state: GlobeState };

type GlobeActions = UpdateProjection | RotateProjection | UpdateState;

function createActions(
  ref: React.RefObject<HTMLElement>,
  props: GlobeProps,
  state: GlobeState,
  dispatch: React.Dispatch<GlobeActions>
) {
  const { projection: _projection, setupProjection, ...rest } = props;

  const updateProjection = (newProj) => {
    dispatch({ type: "update", projection: newProj });
  };

  return {
    resetProjection(newProj) {
      dispatch({ type: "update", projection: setupProjection(newProj, rest) });
    },
    updateProjection,
    rotateProjection(rotation) {
      props.onRotate?.(rotation);
      if (props.rotation != null) return;
      const newProj = setupProjection(state.projection, {
        ...rest,
        rotation,
      });
      updateProjection(newProj);
    },
    dispatchEvent(evt) {
      const v: HTMLElement = ref.current;
      if (v == null) return;
      const el = v.getElementsByClassName(styles.map)[0];
      // Simulate an event directly on the map's DOM element
      const { clientX, clientY } = evt;

      const e1 = new MouseEvent("mousedown", { clientX, clientY });
      const e2 = new MouseEvent("mouseup", { clientX, clientY });

      el.dispatchEvent(e1);
      el.dispatchEvent(e2);
    },
  };
}

const defaultProps = {
  keepNorthUp: false,
  allowDrag: true,
  allowZoom: false,
  center: [0, 0],
  graticule: Graticule,
  projection: geoOrthographic().clipAngle(90).precision(0.5),
  setupProjection: mutateProjection,
};

interface GlobeProps extends ProjectionParams {
  [key: string]: any;
  projection: GeoProjection;
  keepNorthUp: boolean;
  allowDrag: boolean;
  allowZoom: boolean;
  setupProjection: MutateProjection;
  onRotate?(v: RotationAngles): void;
  children?: React.ReactNode;
}

function globeReducer(state: GlobeState, action: GlobeActions) {
  switch (action.type) {
    case "update":
      return {
        ...state,
        updateCount: state.updateCount + 1,
        projection: action.projection,
      };
    case "update-state":
      return action.state;
    case "rotate":
      return {
        ...state,
        updateCount: state.updateCount + 1,
        projection: action.projection.rotate(action.rotation),
      };
  }
}

export function Globe(_props: GlobeProps) {
  const props = { ...defaultProps, ..._props };

  let { width, height, children, keepNorthUp, allowDrag, allowZoom, scale, center, graticule } =
    props;
  const { projection: _projection, setupProjection, ...rest } = props;

  const [mapState, dispatch] = useReducer(globeReducer, {
    projection: setupProjection(_projection, rest),
    zoom: 1,
    canvasContexts: new Set([]),
    updateCount: 0,
  });

  const { projection } = mapState;
  const initialScale = scale || projection.scale() || 500;

  const ref = useRef<HTMLElement>(null);
  const mapElement = useRef<HTMLElement>(null);

  const actions = createActions(ref, props, mapState, dispatch);

  useComponentDidUpdate(
    (prevProps, prevState) => {
      const { width, height, scale, translate, setupProjection } = props;
      const sameDimensions = prevProps.width === width && prevProps.height === height;
      const sameProjection = prevProps.projection === props.projection;

      // For some reason we need this to get the projection to update
      // console.log("projection", prevState.projection == mapState.projection);
      console.log("center", mapState.projection.center());

      let center = props.center;
      if (center == prevProps.center) {
        center = mapState.projection.center();
      }

      const sameScale =
        prevProps.scale === scale &&
        prevProps.translate === translate &&
        prevProps.center === props.center;
      if (sameDimensions && sameProjection && sameScale) {
        return;
      }
      const newProj = setupProjection(mapState.projection, { ...props, center });
      dispatch({ type: "update", projection: newProj });
      actions.updateProjection(newProj);
    },
    props,
    mapState
  );

  const renderPath = geoPath(mapState.projection);
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
        ref,
        xmlns,
        width,
        height,
        viewBox,
      },
      [
        h("g.map", { ref: mapElement }, [h(Background), h(graticule), children, h(Sphere)]),
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

export { MapContext };
export * from "./canvas-layer";
export * from "./feature";
