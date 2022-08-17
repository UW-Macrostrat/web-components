import { RefObject } from "react";
import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { toggleMapLabelVisibility } from "@macrostrat/mapbox-utils";

export function useMapConditionalStyle<T = any>(
  mapRef: RefObject<mapboxgl.Map>,
  state: T,
  operator: (map: mapboxgl.Map, a: T) => void
) {
  /** Apply conditional style logic depending on a state value or object.
   * The operator function can operate on the Map and the state, and is applied on state changes
   * and on style load events. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    operator(map, state);
  }, [mapRef.current, state]);

  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;
    map.on("style.load", () => {
      operator(map, state);
    });
  }, [mapRef.current]);
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
