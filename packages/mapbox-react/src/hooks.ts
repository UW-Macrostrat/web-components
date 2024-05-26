import { RefObject, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { toggleMapLabelVisibility } from "@macrostrat/mapbox-utils";
import { useMapRef, useMapStatus } from "./context";

/** A newer and more flexible version of useMapConditionalStyle */
export function useMapStyleOperator(
  operator: (map: mapboxgl.Map) => void,
  dependencies: any[] = []
) {
  const mapRef = useMapRef();
  const { isStyleLoaded } = useMapStatus();
  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;
    if (isStyleLoaded) {
      operator(map);
    }
    const fn = () => operator(map);
    map.on("style.load", fn);
    return () => {
      map.off("style.load", fn);
    };
  }, [mapRef.current, isStyleLoaded, ...dependencies]);
}

/**
 * Apply conditional style logic depending on a state value or object.
 * The operator function can operate on the Map and the state, and is applied on state changes
 * and on style load events.
 * @deprecated Use useMapStyleCallback instead
 */
export function useMapConditionalStyle<T = any>(
  mapRef: RefObject<mapboxgl.Map>,
  state: T,
  operator: (map: mapboxgl.Map, a: T) => void
) {
  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;
    if (map.isStyleLoaded()) {
      operator(map, state);
    }
    const fn = () => operator(map, state);
    map.on("style.load", fn);
    return () => {
      map.off("style.load", fn);
    };
  }, [mapRef.current, state]);
}

const _toggleMapLabels = (map, state) =>
  toggleMapLabelVisibility(map, state.mapShowLabels, state.omitLayers);

export function useMapLabelVisibility(
  mapRef: RefObject<mapboxgl.Map>,
  mapShowLabels: boolean,
  omitLayers: string[] = []
) {
  useMapConditionalStyle(
    mapRef,
    { mapShowLabels, omitLayers },
    _toggleMapLabels
  );
}
