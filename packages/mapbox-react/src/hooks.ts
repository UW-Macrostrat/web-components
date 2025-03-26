import { RefObject, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { toggleMapLabelVisibility } from "@macrostrat/mapbox-utils";
import { useMapRef, useMapStatus } from "./context";
import { useCallback } from "react";

/** A newer and more flexible version of useMapConditionalStyle */
export function useMapStyleOperator(
  operator: (map: mapboxgl.Map) => void,
  dependencies: any[] = []
) {
  const mapRef = useMapRef();
  const isStyleLoaded = useMapStatus((s) => s.isStyleLoaded);

  const callback = useCallback((map) => {
    if (map == null) return;
    operator(map);
  }, dependencies);

  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;
    // TODO: figure out what is wrong with the isStyleLoaded state
    if (isStyleLoaded) {
      callback(map);
    }
  }, [callback, isStyleLoaded]);
}

/**
 * Apply conditional style logic depending on a state value or object.
 * The operator function can operate on the Map and the state, and is applied on state changes
 * and on style load events.
 * @deprecated Use useMapStyleOperator instead
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

export function useMapClickHandler(
  fn: (e: mapboxgl.MapMouseEvent) => void,
  deps: any[]
) {
  const clickFn = useCallback(fn, deps);
  useMapStyleOperator(
    (map) => {
      map.on("click", clickFn);
      return () => {
        map.off("click", clickFn);
      };
    },
    [clickFn]
  );
}
