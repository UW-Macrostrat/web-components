import { createContext, useContext, RefObject, useRef } from "react";
import { Map } from "mapbox-gl";
import h from "@macrostrat/hyper";

const MapContext = createContext<RefObject<Map | null>>(null);

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
  const mapRef = useMapRef() ?? useRef<Map | null>();
  return h(MapContext.Provider, { value: mapRef }, children);
}
