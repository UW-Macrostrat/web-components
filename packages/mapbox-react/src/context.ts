import {
  createContext,
  useContext,
  RefObject,
  useRef,
  useCallback,
  useMemo,
  useReducer,
  Reducer,
} from "react";
import update from "immutability-helper";
import { Map } from "mapbox-gl";
import h from "@macrostrat/hyper";
import { MapPosition } from "@macrostrat/mapbox-utils";

interface MapStatus {
  isLoading: boolean;
  isInitialized: boolean;
  isStyleLoaded: boolean;
}

interface MapCtx {
  mapRef: RefObject<Map | null>;
  status: MapStatus;
  position: MapPosition;
}

const MapContext = createContext<MapCtx>({
  mapRef: null,
  status: {
    isLoading: false,
    isInitialized: false,
    isStyleLoaded: false,
  },
  position: null,
});

const MapDispatchContext = createContext<React.Dispatch<MapAction>>(null);

export function useMapRef() {
  const { mapRef } = useContext(MapContext);
  return useMemo(() => mapRef, [mapRef]);
}

export function useMapStatus() {
  const { status } = useContext(MapContext);
  return useMemo(() => status, [status]);
}

export function useMapPosition() {
  const { position } = useContext(MapContext);
  return useMemo(() => position, [position]);
}

export function useMapElement() {
  return useMapRef().current;
}

export function useMap(): Map | null {
  return useMapRef().current;
}

export function useMapDispatch() {
  return useContext(MapDispatchContext);
}

type MapAction =
  | { type: "set-loading"; payload: boolean }
  | { type: "set-initialized"; payload: boolean }
  | { type: "set-style-loaded"; payload: boolean }
  | { type: "map-moved"; payload: MapPosition }
  | { type: "set-map"; payload: Map };

function mapReducer(state: MapCtx, action: MapAction): MapCtx {
  switch (action.type) {
    case "set-map":
      return update(state, {
        mapRef: { current: { $set: action.payload } },
        status: { isInitialized: { $set: true } },
      });
    case "set-loading":
      return update(state, { status: { isLoading: { $set: action.payload } } });
    case "set-initialized":
      return update(state, {
        status: { isInitialized: { $set: action.payload } },
      });
    case "set-style-loaded":
      return update(state, {
        status: { isStyleLoaded: { $set: action.payload } },
      });
    case "map-moved":
      return { ...state, position: action.payload };
  }
}

export function MapboxMapProvider({ children }) {
  const mapRef = useRef<Map | null>();
  const [value, dispatch] = useReducer<Reducer<MapCtx, MapAction>>(mapReducer, {
    mapRef,
    status: {
      isLoading: false,
      isInitialized: false,
      isStyleLoaded: false,
    },
    position: null,
  });

  return h(
    MapDispatchContext.Provider,
    { value: dispatch },
    h(MapContext.Provider, { value }, children)
  );
}
