import { createContext, useContext, RefObject, useRef } from "react";
import { Map } from "mapbox-gl";
import h from "@macrostrat/hyper";

const MapContext = createContext<RefObject<Map | null>>(null);

interface MapStatus {
  isLoading: boolean;
  isInitialized: boolean;
  isStyleLoaded: boolean;
}

const MapStatusContext = createContext<MapStatus>({
  isLoading: false,
  isInitialized: false,
  isStyleLoaded: false,
});

export function useMapRef() {
  return useContext(MapContext);
}

export function useMapElement() {
  return useMapRef().current;
}

export function useMap(): Map | null {
  return useMapRef().current;
}

export function MapboxMapProvider({ children }) {
  const mapRef = useRef<Map | null>();
  return h(MapContext.Provider, { value: mapRef }, children);
}
