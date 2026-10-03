import { setMapPosition, type MapPosition } from "@macrostrat/mapbox-utils";
import mapboxgl from "mapbox-gl";

export type MapboxCoreOptions = Omit<mapboxgl.MapboxOptions, "container">;

export interface MapboxOptionsExt extends MapboxCoreOptions {
  mapPosition?: MapPosition;
}

export function defaultInitializeMap(container, args: MapboxOptionsExt = {}) {
  const { mapPosition, ...rest } = args;

  const map = new mapboxgl.Map({
    container,
    maxZoom: 18,
    logoPosition: "bottom-left",
    trackResize: false,
    antialias: true,
    // This is a legacy option for Mapbox GL v2
    // @ts-ignore
    optimizeForTerrain: true,
    ...rest,
  });

  let _mapPosition = mapPosition;
  if (_mapPosition == null && rest.center == null && rest.bounds == null) {
    // If no map positioning information is provided, we use the default
    _mapPosition = defaultMapPosition;
  }

  // set initial map position
  if (_mapPosition != null) {
    setMapPosition(map, _mapPosition);
  }

  return map;
}

export const defaultMapPosition: MapPosition = {
  camera: {
    lat: 34,
    lng: -120,
    altitude: 300000,
  },
};
