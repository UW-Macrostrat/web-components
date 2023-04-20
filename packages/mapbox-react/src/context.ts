import {
  createContext,
  useContext,
  RefObject,
  useRef,
  useCallback,
  useMemo,
  useReducer,
} from "react";
import { Map } from "mapbox-gl";
import h from "@macrostrat/hyper";
import { MapPosition } from "@macrostrat/mapbox-utils";

interface MapStatus {
  isLoading: boolean;
  isInitialized: boolean;
  isStyleLoaded: boolean;
  mapPosition: MapPosition;
}

interface MapCtx {
  mapRef: RefObject<Map | null>;
  status: MapStatus;
}

const MapContext = createContext<MapCtx>({
  mapRef: null,
  status: {
    isLoading: false,
    isInitialized: false,
    isStyleLoaded: false,
    mapPosition: null,
  },
});

const MapDispatchContext = createContext<React.Dispatch<MapAction>>(null);

export function useMapRef() {
  return useContext(MapContext).mapRef;
}

export function useMapStatus() {
  return useContext(MapContext).status;
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
  | { type: "map-moved"; payload: MapPosition };

type MapActionExt = MapAction | { type: "set-map"; payload: Map };

function mapReducer(state: MapStatus, action: MapAction): MapStatus {
  switch (action.type) {
    case "set-loading":
      return { ...state, isLoading: action.payload };
    case "set-initialized":
      return { ...state, isInitialized: action.payload };
    case "set-style-loaded":
      return { ...state, isStyleLoaded: action.payload };
    case "map-moved":
      return { ...state, mapPosition: action.payload };
  }
}

export function MapboxMapProvider({ children }) {
  const mapRef = useRef<Map | null>();
  const [status, dispatch] = useReducer(mapReducer, {
    isLoading: false,
    isInitialized: false,
    isStyleLoaded: false,
    mapPosition: null,
  });

  const value = useMemo(() => {
    return { mapRef, status };
  }, [mapRef, status]);

  const mapDispatch = useCallback(
    (action: MapActionExt) => {
      if (action.type == "set-map") {
        mapRef.current = action.payload;
        dispatch({ type: "set-initialized", payload: true });
      } else {
        dispatch(action);
      }
    },
    [dispatch]
  );

  return h(
    MapDispatchContext.Provider,
    { value: mapDispatch },
    h(MapContext.Provider, { value }, children)
  );
}
