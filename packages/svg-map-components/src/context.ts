import { createContext, useContext, RefObject } from "react";
import h from "@macrostrat/hyper";
import { GeoProjection, GeoGeometryObjects, geoOrthographic } from "d3-geo";

type RotationAngles = [number, number, number] | [number, number];
type GlobeState = {
  projection: GeoProjection;
  zoom: number;
  canvasContexts: Set<CanvasRenderingContext2D[]>;
  updateCount: number;
};

interface PathRenderer {
  (geom: GeoGeometryObjects): string;
  pointRadius(radius: number): PathRenderer;
}

export type GlobeCtx = {
  width: number;
  height: number;
  margin: number;
  renderPath: PathRenderer | null;
  projection: GeoProjection;
  mapRef: RefObject<SVGElement> | null;
  dispatchEvent?: (event: Event) => void;
};

type UpdateProjection = { type: "update"; projection: GeoProjection };
type ScaleProjection = { type: "scale"; scale: number };
type RotateProjection = { type: "rotate"; rotation: RotationAngles };
type UpdateState = { type: "update-state"; state: GlobeState };

type GlobeActions =
  | UpdateProjection
  | RotateProjection
  | UpdateState
  | ScaleProjection;

const MapContext = createContext<GlobeCtx>({
  width: 0,
  height: 0,
  margin: 0,
  renderPath: null,
  projection: geoOrthographic(),
  mapRef: null,
});

const MapDispatchContext = createContext<(action: GlobeActions) => void>(
  () => {}
);

function useMapDispatch() {
  return useContext(MapDispatchContext);
}

function useMap() {
  return useContext(MapContext);
}

function useMapRef() {
  return useMap().mapRef;
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
        projection: state.projection.rotate(action.rotation),
      };
    case "scale":
      return globeReducer(state, {
        type: "update",
        projection: state.projection.scale(action.scale),
      });
  }
}

function GeoPath(props) {
  const { geometry, ...rest } = props;
  const { renderPath } = useMap();
  const d = geometry != null ? renderPath(geometry) : null;
  return h("path", { d, ...rest });
}

export {
  MapContext,
  useMapDispatch,
  MapDispatchContext,
  useMap,
  useMapRef,
  globeReducer,
  GlobeActions,
  GlobeState,
  GeoPath,
  RotationAngles,
};
