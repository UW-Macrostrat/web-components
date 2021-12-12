import { createContext, useContext } from "react";
import h from "@macrostrat/hyper";
import { GeoProjection, GeoGeometryObjects } from "d3-geo";

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
};

type UpdateProjection = { type: "update"; projection: GeoProjection };
type RotateProjection = { type: "rotate"; rotation: RotationAngles };
type UpdateState = { type: "update-state"; state: GlobeState };

type GlobeActions = UpdateProjection | RotateProjection | UpdateState;

const MapContext = createContext<GlobeCtx>({
  width: 0,
  height: 0,
  renderPath: (geom) => null,
});

const MapProvider = (props) => {
  const { projection, children } = props;
  return h(MapContext.Provider, { value: { projection } }, children);
};

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
  }
}

export {
  MapContext,
  MapProvider,
  useMapDispatch,
  MapDispatchContext,
  useMap,
  globeReducer,
  GlobeActions,
  GlobeState,
  RotationAngles,
};
