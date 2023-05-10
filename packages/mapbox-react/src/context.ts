import {
  createContext,
  useContext,
  RefObject,
  useRef,
  useState,
  useMemo,
} from "react";
import { Map } from "mapbox-gl";
import h from "@macrostrat/hyper";

interface MapStatus {
  isLoading: boolean;
  isInitialized: boolean;
  isStyleLoaded: boolean;
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
  },
});

const MapActionContext = createContext({
  setMap: (map: Map) => {},
  setStyleLoaded: (isLoaded: boolean) => {},
  setLoading: (isLoading: boolean) => {},
});

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

export function useMapActions() {
  return useContext(MapActionContext);
}

export function MapboxMapProvider({ children }) {
  const mapRef = useRef<Map | null>();
  const [status, setStatus] = useState<MapStatus>({
    isLoading: false,
    isInitialized: false,
    isStyleLoaded: false,
  });

  const value = useMemo(() => {
    return { mapRef, status };
  }, [mapRef, status]);

  const actionContext = useMemo(() => {
    return {
      setMap: (map: Map) => {
        mapRef.current = map;
        setStatus((s) => ({ ...s, isInitialized: true }));
      },
      setStyleLoaded: () => {
        setStatus((s) => ({ ...s, isStyleLoaded: true }));
      },
      setLoading: (isLoading: boolean) => {
        setStatus((s) => ({ ...s, isLoading }));
      },
    };
  }, []);

  return h(
    MapActionContext.Provider,
    { value: actionContext },
    h(MapContext.Provider, { value }, children)
  );
}
