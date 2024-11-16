import {
  createContext,
  useContext,
  RefObject,
  useRef,
  useReducer,
  useCallback,
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
  status: MapStatus;
  position: MapPosition;
}

const defaultMapStatus: MapStatus = {
  isLoading: false,
  isInitialized: false,
  isStyleLoaded: false,
};

const MapDispatchContext = createContext<React.Dispatch<MapAction>>(null);
const MapRefContext = createContext<RefObject<Map | null>>(null);
const MapStatusContext = createContext<MapStatus>(defaultMapStatus);
const MapPositionContext = createContext<MapPosition>(null);

export function useMapRef() {
  return useContext(MapRefContext);
}

export function useMapStatus() {
  return useContext(MapStatusContext);
}

export function useMapPosition() {
  return useContext(MapPositionContext);
}

export function useMapElement(): Map | null {
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
        status: {
          isInitialized: { $set: true },
        },
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
  const [value, _dispatch] = useReducer<Reducer<MapCtx, MapAction>>(
    mapReducer,
    {
      status: defaultMapStatus,
      position: null,
    }
  );

  const dispatch = useCallback((action: MapAction) => {
    if (action.type === "set-map") {
      mapRef.current = action.payload;
    }
    _dispatch(action);
  }, []);

  return h(
    MapDispatchContext.Provider,
    { value: dispatch },
    h(
      MapRefContext.Provider,
      { value: mapRef },
      h(
        MapStatusContext.Provider,
        { value: value.status },
        h(MapPositionContext.Provider, { value: value.position }, children)
      )
    )
  );
}
