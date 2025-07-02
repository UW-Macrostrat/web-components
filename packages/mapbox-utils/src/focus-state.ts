/* Reporters for evaluating a feature's focus on the map.
 *
 * Originally from @macrostrat/mapbox-react
 *  */
import bbox from "@turf/bbox";

import type GeoJSON from "geojson";
import type {
  LngLatBoundsLike,
  LngLatLike,
  PaddingOptions,
  AnimationOptions,
  CameraOptions,
  Map,
} from "mapbox-gl";

/**
 * FlyToOptions
 * For some reason, we have to shadow the mapboxgl.FlyToOptions type
 * */
export interface FlyToOptions extends AnimationOptions, CameraOptions {
  curve?: number | undefined;
  minZoom?: number | undefined;
  speed?: number | undefined;
  screenSpeed?: number | undefined;
  maxDuration?: number | undefined;
}

export enum PositionFocusState {
  CENTERED,
  NEAR_CENTER,
  OFF_CENTER,
  OUT_OF_PADDING,
  OUT_OF_VIEW,
}

export interface MapEaseToState {
  bounds?: LngLatBoundsLike;
  padding?: PaddingOptions | number;
  center?: LngLatLike;
  zoom?: number;
}

export function filterChanges(
  a: MapEaseToState,
  b: MapEaseToState | null,
): Partial<MapEaseToState> {
  if (b == null) return stripNullKeys(a);
  return getChangedKeys(a, b);
}

function getChangedKeys<T = object>(a: T, b: T): Partial<T> {
  /** Find the keys of an object that have changed */
  const keys = Object.keys(a) as (keyof T)[];
  let reduced = keys.reduce((acc, key) => {
    if (a[key] !== b[key] && a[key] != null) {
      acc[key] = a[key];
    }
    return acc;
  }, {} as Partial<T>);
  return stripNullKeys(reduced);
}

function stripNullKeys(obj: object) {
  let newObj = { ...obj };
  for (const [key, val] of Object.entries(newObj)) {
    if (val == null) {
      delete newObj[key];
    }
  }
  return newObj;
}

export function moveMap(
  map: mapboxgl.Map,
  state: MapEaseToState,
  opts: FlyToOptions,
) {
  /** This function possibly duplicates some of the functionality of setMapPosition */
  const { bounds, center, zoom, padding } = state;
  if (bounds != null) {
    map.fitBounds(bounds, opts);
  } else if (center != null || zoom != null || padding != null) {
    let props = { ...opts };
    if (padding != null) {
      props.padding = padding;
    }
    if (center != null) {
      props.center = center;
    }
    if (zoom != null) {
      props.zoom = zoom;
    }
    map.flyTo(stripNullKeys(props));
  }
}

export function greatCircleDistance(
  l1: mapboxgl.LngLatLike,
  l2: mapboxgl.LngLatLike,
): number {
  // get distance in radians between l1 and l2
  const dLon = ((l2[0] - l1[0]) * Math.PI) / 180;

  // Spherical law of cosines (accurate at large distances)
  const lat1 = (l1[1] * Math.PI) / 180;
  const lat2 = (l2[1] * Math.PI) / 180;
  return Math.acos(
    Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon),
  );
}

export function getFocusState(
  map: Map,
  location: LngLatLike | GeoJSON.Geometry | null,
): PositionFocusState | null {
  /** Determine whether the infomarker is positioned in the viewport */
  if (location == null) return null;

  const mapCenter = map.getCenter();

  if (location.hasOwnProperty("lng") && location.hasOwnProperty("lat")) {
    const loc = location as { lng: number; lat: number };
    location = [loc.lng, loc.lat];
  }

  if (!(location instanceof Array)) {
    // Get geometry bounding box
    const bounds = bbox(location as any);
    location = [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
    // For non-points this is extremely simplistic at the moment
  }

  const dist = greatCircleDistance(location, mapCenter);
  if (dist > Math.PI / 4) {
    return PositionFocusState.OFF_CENTER;
  } else if (dist > Math.PI / 2) {
    return PositionFocusState.OUT_OF_VIEW;
  }

  const markerPos = map.project(location);
  const mapPos = map.project(mapCenter);
  const dx = Math.abs(markerPos.x - mapPos.x);
  const dy = Math.abs(markerPos.y - mapPos.y);
  const padding = map.getPadding();
  let { width, height } = map.getCanvas();
  width /= 2;
  height /= 2;

  if (dx < 10 && dy < 10) {
    return PositionFocusState.CENTERED;
  }
  if (dx < 150 && dy < 150) {
    return PositionFocusState.NEAR_CENTER;
  }

  if (
    markerPos.x > padding.left &&
    markerPos.x < width - padding.right &&
    markerPos.y > padding.top &&
    markerPos.y < height - padding.bottom
  ) {
    return PositionFocusState.OFF_CENTER;
  }

  if (
    markerPos.x > 0 &&
    markerPos.x < width &&
    markerPos.y > 0 &&
    markerPos.y < height
  ) {
    return PositionFocusState.OUT_OF_PADDING;
  }
  return PositionFocusState.OUT_OF_VIEW;
}

export function isCentered(focusState: PositionFocusState) {
  return (
    focusState == PositionFocusState.CENTERED ||
    focusState == PositionFocusState.NEAR_CENTER
  );
}

export function getCenterAndBestZoom(
  input: [number, number] | GeoJSON.Geometry | GeoJSON.BBox | LngLatLike,
) {
  let box: GeoJSON.BBox;
  let center: [number, number] | null = null;
  let zoom: number | null = null;

  if (input instanceof Array) {
    if (input.length === 2) {
      center = input;
    } else if (input.length === 4) {
      box = input;
    }
  }

  if (input.hasOwnProperty("lat") && input.hasOwnProperty("lng")) {
    input = input as { lat: number; lng: number };
    center = [input.lng, input.lat];
  }

  // If input is a geometry, get its bounding box
  if (input.hasOwnProperty("type") && input.hasOwnProperty("coordinates")) {
    input = input as GeoJSON.Geometry;
    if (input.type === "Point") {
      center = input.coordinates as [number, number];
    } else {
      box = bbox(input);
    }
  }

  if (box != null) {
    center = [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2];
    const dist = greatCircleDistance(center, [box[0], box[1]]);
    zoom = Math.log2((Math.PI * 2) / dist) - 1;
  }
  return { center, zoom };
}
