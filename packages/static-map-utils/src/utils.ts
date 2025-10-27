import {
  useMapDispatch,
  useMapInitialized,
  useMapRef,
  useMapStatus,
} from "@macrostrat/mapbox-react";
import { useCallback, useEffect } from "react";
import maplibre from "maplibre-gl";
import { CameraPosition, MapPosition } from "@macrostrat/mapbox-utils";
import { debounce } from "underscore";

export function StyleLoadedReporter({ onStyleLoaded = null }) {
  /** Check back every 0.1 seconds to see if the map has loaded.
   * We do it this way because mapboxgl loading events are unreliable */
  const isStyleLoaded = useMapStatus((state) => state.isStyleLoaded);
  const mapRef = useMapRef();
  const dispatch = useMapDispatch();

  useEffect(() => {
    if (isStyleLoaded) return;
    const interval = setInterval(() => {
      const map = mapRef.current;
      if (map == null) return;
      if (map.isStyleLoaded()) {
        // Wait a tick before setting the style loaded state
        dispatch({ type: "set-style-loaded", payload: true });
        onStyleLoaded?.(map);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isStyleLoaded]);

  return null;
}

/** Todo: reintegrate these utility functions with Mapbox utils */
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

function getMapPosition(map: maplibre.Map): MapPosition {
  return {
    camera: getCameraPosition(map),
    target: {
      ...map.getCenter(),
      zoom: map.getZoom(),
    },
  };
}

function getCameraPosition(map: maplibre.Map): CameraPosition {
  const latLong = map.transform.getCameraLngLat();
  return {
    lng: latLong.lng,
    lat: latLong.lat,
    altitude: map.transform.getCameraAltitude(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
  };
}

export function setMapPosition(map: maplibre.Map, pos: MapPosition) {
  const { pitch = 0, bearing = 0, altitude } = pos.camera;
  const zoom = pos.target?.zoom;
  if (zoom != null && altitude == null && pitch == 0 && bearing == 0) {
    const { lng, lat } = pos.target;
    // Zoom must be set before center to correctly recall position
    map.setZoom(zoom);
    map.setCenter([lng, lat]);
  } else {
    const { altitude, lng, lat } = pos.camera;
    map.jumpTo({
      center: [lng, lat],
      zoom: zoom ?? map.getZoom(),
      bearing: bearing ?? map.getBearing(),
      pitch: pitch ?? map.getPitch(),
      // @ts-ignore
      altitude: altitude,
    });
  }
}
export function prepareStyleForMaplibre(
  style: mapboxgl.StyleSpecification | string,
  accessToken: string,
): maplibre.StyleSpecification {
  // Convert any Mapbox-specific properties to Maplibre-compatible ones
  let newStyle = {
    ...style,
    layers: style.layers.filter((d) => d.type !== "sky"),
  };

  delete newStyle.projection;

  return newStyle;
}
