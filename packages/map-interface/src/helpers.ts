import { useMapRef, useMapEaseToCenter } from "@macrostrat/mapbox-react";
import { useRef } from "react";
import { debounce } from "underscore";
import useResizeObserver from "use-resize-observer";

import { getMapPosition } from "@macrostrat/mapbox-utils";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useState } from "react";
import { getMapPadding, useMapMarker } from "./utils";

export function MapResizeManager({ containerRef }) {
  const mapRef = useMapRef();

  const debouncedResize = useRef(
    debounce(() => {
      mapRef.current?.resize();
    }, 100)
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
}

export function MapPaddingManager({
  containerRef,
  parentRef,
  infoMarkerPosition,
}: MapPaddingManagerProps) {
  const mapRef = useMapRef();

  const [padding, setPadding] = useState(
    getMapPadding(containerRef, parentRef)
  );

  const updateMapPadding = useCallback(() => {
    setPadding(getMapPadding(containerRef, parentRef));
  }, [containerRef, parentRef]);

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
  });

  useMapEaseToCenter(infoMarkerPosition, padding);

  return null;
}

export function MapMovedReporter({ onMapMoved }) {
  const mapRef = useMapRef();

  const mapMovedCallback = useCallback(() => {
    const map = mapRef.current;
    if (map == null) return;
    onMapMoved(getMapPosition(map), map);
  }, [mapRef.current, onMapMoved]);

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

export function MapLoadingReporter({
  ignoredSources,
  onMapLoading,
  onMapIdle,
  mapIsLoading,
}) {
  const mapRef = useMapRef();

  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;

    let didSendLoading = false;

    const loadingCallback = (evt) => {
      if (ignoredSources.includes(evt.sourceId) || mapIsLoading) return;
      if (didSendLoading) return;
      onMapLoading?.(evt);
      didSendLoading = true;
    };
    const idleCallback = (evt) => {
      if (!mapIsLoading) return;
      onMapIdle?.(evt);
    };
    map.on("sourcedataloading", loadingCallback);
    map.on("idle", idleCallback);
    return () => {
      map?.off("sourcedataloading", loadingCallback);
      map?.off("idle", idleCallback);
    };
  }, [ignoredSources, mapRef.current, mapIsLoading]);
  return null;
}

export function MapMarker({ position, setPosition, centerMarker = true }) {
  const mapRef = useMapRef();
  const markerRef = useRef(null);

  useMapMarker(mapRef, markerRef, position);

  const handleMapClick = useCallback(
    (event: mapboxgl.MapMouseEvent) => {
      setPosition(event.lngLat, event, mapRef.current);
      // We should integrate this with the "easeToCenter" hook
      if (centerMarker) {
        mapRef.current?.flyTo({ center: event.lngLat, duration: 800 });
      }
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapRef.current, setPosition]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (map != null && setPosition != null) {
      map.on("click", handleMapClick);
    }
    return () => {
      map?.off("click", handleMapClick);
    };
  }, [mapRef.current, setPosition]);

  return null;
}
