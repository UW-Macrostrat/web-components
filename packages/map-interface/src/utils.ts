import { useEffect } from "react";
import { Marker } from "mapbox-gl";

function calcMapPadding(rect, childRect) {
  return {
    left: Math.max(rect.left - childRect.left, 0),
    top: Math.max(rect.top - childRect.top, 0),
    right: Math.max(childRect.right - rect.right, 0),
    bottom: Math.max(childRect.bottom - rect.bottom, 0),
  };
}

export function getMapPadding(ref, parentRef) {
  const rect = parentRef.current?.getBoundingClientRect();
  const childRect = ref.current?.getBoundingClientRect();
  if (rect == null || childRect == null) return;
  return calcMapPadding(rect, childRect);
}

export function useMapMarker(mapRef, markerRef, markerPosition) {
  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;
    if (markerPosition == null) {
      markerRef.current?.remove();
      return;
    }
    const marker = markerRef.current ?? new Marker();
    marker.setLngLat(markerPosition).addTo(map);
    markerRef.current = marker;
    return () => marker.remove();
  }, [mapRef.current, markerPosition]);
}
