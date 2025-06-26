import {
  useMapRef,
  useMapEaseTo,
  useMapDispatch,
  useMapStatus,
  useMapInitialized,
} from "@macrostrat/mapbox-react";
import { useMemo, useRef } from "react";
import { debounce } from "underscore";
import useResizeObserver from "use-resize-observer";

import { getMapPosition } from "@macrostrat/mapbox-utils";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import { getMapPadding, useMapMarker } from "./utils";
import { useInDarkMode } from "@macrostrat/ui-components";

export function MapResizeManager({ containerRef }) {
  const mapRef = useMapRef();

  const debouncedResize = useRef(
    debounce(() => {
      mapRef.current?.resize();
    }, 100),
  );

  useResizeObserver({
    ref: containerRef,
    onResize: debouncedResize.current,
  });

  return null;
}

interface MapPaddingManagerProps {
  containerRef: React.RefObject<HTMLDivElement>;
  parentRef: React.RefObject<HTMLDivElement>;
  infoMarkerPosition: mapboxgl.LngLatLike;
  debounceTime?: number;
}

export function MapPaddingManager({
  containerRef,
  parentRef,
  infoMarkerPosition,
  debounceTime = 200,
}: MapPaddingManagerProps) {
  const mapRef = useMapRef();

  const [padding, setPadding] = useState(
    getMapPadding(containerRef, parentRef),
  );

  const _updateMapPadding = useCallback(() => {
    const newPadding = getMapPadding(containerRef, parentRef);
    setPadding(newPadding);
  }, [containerRef.current, parentRef.current]);

  const updateMapPadding = useMemo(
    () => debounce(_updateMapPadding, debounceTime),
    [_updateMapPadding, debounceTime],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;
    // Update map padding on load
    updateMapPadding();
  }, [mapRef.current]);

  useResizeObserver({
    ref: parentRef,
    onResize(sz) {
      updateMapPadding();
    },
    round(n) {
      return Math.round(n);
    },
  });

  // Ideally, we would not have to do this when we know the infobox is loaded
  useMapEaseTo({ center: infoMarkerPosition, padding });

  return null;
}

export function MapMovedReporter({ onMapMoved = null }) {
  const mapRef = useMapRef();
  const dispatch = useMapDispatch();
  const isInitialized = useMapInitialized();

  const mapMovedCallback = useCallback(() => {
    const map = mapRef.current;
    if (map == null) return;
    const mapPosition = getMapPosition(map);
    dispatch({ type: "map-moved", payload: mapPosition });
    onMapMoved?.(mapPosition, map);
  }, [onMapMoved, dispatch, isInitialized]);

  useEffect(() => {
    // Get the current value of the map. Useful for gradually moving away
    // from class component
    const map = mapRef.current;
    if (map == null) return;
    // Update the URI when the map moves
    mapMovedCallback();
    const cb = debounce(mapMovedCallback, 100);
    map.on("moveend", cb);
    return () => {
      map?.off("moveend", cb);
    };
  }, [mapMovedCallback]);
  return null;
}

interface MapLoadingReporterProps {
  ignoredSources?: string[];
  onMapLoading?: (evt: mapboxgl.MapEvent) => void;
  onMapIdle?: (evt: mapboxgl.MapEvent) => void;
  mapIsLoading?: boolean;
}

export function MapLoadingReporter({
  ignoredSources,
  onMapLoading = null,
  onMapIdle = null,
  mapIsLoading,
}: MapLoadingReporterProps) {
  const mapRef = useMapRef();
  const loadingRef = useRef(false);
  const dispatch = useMapDispatch();
  const isInitialized = useMapInitialized();

  useEffect(() => {
    const map = mapRef.current;
    const mapIsLoading = loadingRef.current;
    if (map == null) return;

    let didSendLoading = false;

    const loadingCallback = (evt) => {
      if (ignoredSources.includes(evt.sourceId) || mapIsLoading) return;
      if (didSendLoading) return;
      onMapLoading?.(evt);
      dispatch({ type: "set-loading", payload: true });
      loadingRef.current = true;
      didSendLoading = true;
    };
    const idleCallback = (evt) => {
      if (!mapIsLoading) return;
      dispatch({ type: "set-loading", payload: false });
      loadingRef.current = false;
      onMapIdle?.(evt);
    };
    map.on("sourcedataloading", loadingCallback);
    map.on("idle", idleCallback);
    return () => {
      map?.off("sourcedataloading", loadingCallback);
      map?.off("idle", idleCallback);
    };
  }, [ignoredSources, mapIsLoading, isInitialized]);
  return null;
}

export function MapMarker({ position, setPosition, centerMarker = true }) {
  const mapRef = useMapRef();
  const markerRef = useRef(null);
  const isInitialized = useMapInitialized();

  useMapMarker(mapRef, markerRef, position);

  useEffect(() => {
    const map = mapRef.current;
    if (map == null || setPosition == null) return;

    const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
      setPosition(event.lngLat, event, mapRef.current);
      // We should integrate this with the "easeToCenter" hook
      if (centerMarker) {
        mapRef.current?.flyTo({ center: event.lngLat, duration: 800 });
      }
    };

    map.on("click", handleMapClick);

    return () => {
      map?.off("click", handleMapClick);
    };
  }, [setPosition, isInitialized]);

  return null;
}

export function useBasicMapStyle(
  opts: {
    styleType?: "macrostrat" | "standard";
  } = {},
) {
  const { styleType } = opts;
  const inDarkMode = useInDarkMode();

  const props = useMemo(() => {
    return { styleType, inDarkMode };
  }, [styleType, inDarkMode]);

  return getBasicMapStyle(props);
}

export function getBasicMapStyle(opts: {
  styleType?: "macrostrat" | "standard";
  inDarkMode?: boolean;
}) {
  const { styleType = "macrostrat", inDarkMode = false } = opts ?? {};

  if (styleType == "macrostrat") {
    return inDarkMode
      ? "mapbox://styles/jczaplewski/cl5uoqzzq003614o6url9ou9z?optimize=true"
      : "mapbox://styles/jczaplewski/clatdbkw4002q14lov8zx0bm0?optimize=true";
  } else {
    return inDarkMode
      ? "mapbox://styles/mapbox/dark-v10"
      : "mapbox://styles/mapbox/light-v10";
  }
}

export const useBasicStylePair = useBasicMapStyle;
