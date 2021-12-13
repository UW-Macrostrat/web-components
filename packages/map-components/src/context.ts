import { createContext, useContext } from "react";
import h from "@macrostrat/hyper";
import { GeoProjection, GeoGeometryObjects, geoOrthographic } from "d3-geo";

type RotationAngles = [number, number, number] | [number, number];
type GlobeState = {
  projection: GeoProjection;
  zoom: number;
  canvasContexts: Set<CanvasRenderingContext2D[]>;
  updateCount: number;
};

type GlobeCtx = {
  width: number;
  height: number;
  renderPath: (geom: GeoGeometryObjects) => string;
  projection: GeoProjection;
};

type UpdateProjection = { type: "update"; projection: GeoProjection };
type ScaleProjection = { type: "scale"; scale: number };
type RotateProjection = { type: "rotate"; rotation: RotationAngles };
type UpdateState = { type: "update-state"; state: GlobeState };

type GlobeActions = UpdateProjection | RotateProjection | UpdateState | ScaleProjection;

const MapContext = createContext<GlobeCtx>({
  width: 0,
  height: 0,
  renderPath: (geom) => null,
  projection: geoOrthographic(),
});

const MapDispatchContext = createContext<(action: GlobeActions) => void>(() => {});

function useMapDispatch() {
  return useContext(MapDispatchContext);
}

function useMap() {
  return useContext(MapContext);
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

export {
  MapContext,
  useMapDispatch,
  MapDispatchContext,
  useMap,
  globeReducer,
  GlobeActions,
  GlobeState,
  RotationAngles,
};
