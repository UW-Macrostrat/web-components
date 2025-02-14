/* Reporters and buttons for evaluating a feature's focus on the map. */
import { Intent, Button } from "@blueprintjs/core";
import { useMapInitialized, useMapRef, useMapStatus } from "./context";
import classNames from "classnames";
import { useState, useRef, useEffect } from "react";
import bbox from "@turf/bbox";
import styles from "./main.module.scss";
import hyper from "@macrostrat/hyper";
import mapboxgl, {
  LngLatBoundsLike,
  LngLatLike,
  PaddingOptions,
} from "mapbox-gl";
import type { GeoJSON } from "geojson";

const h = hyper.styled(styles);

export enum PositionFocusState {
  CENTERED,
  NEAR_CENTER,
  OFF_CENTER,
  OUT_OF_PADDING,
  OUT_OF_VIEW,
}

export function classNameForFocusState(pos: PositionFocusState): string {
  switch (pos) {
    case PositionFocusState.CENTERED:
      return "centered";
    case PositionFocusState.NEAR_CENTER:
      return "near-center";
    case PositionFocusState.OFF_CENTER:
      return "off-center";
    case PositionFocusState.OUT_OF_PADDING:
      return "out-of-padding";
    case PositionFocusState.OUT_OF_VIEW:
      return "out-of-view";
  }
}

export function intentForFocusState(pos: PositionFocusState): Intent {
  switch (pos) {
    case PositionFocusState.CENTERED:
    case PositionFocusState.NEAR_CENTER:
      return Intent.NONE;
    case PositionFocusState.OFF_CENTER:
      return Intent.PRIMARY;
    case PositionFocusState.OUT_OF_PADDING:
      return Intent.SUCCESS;
    case PositionFocusState.OUT_OF_VIEW:
      return Intent.WARNING;
  }
}

/**
 * Ease the map to a center position with optional padding.
 * @deprecated Use useMapEaseTo instead
 */
export function useMapEaseToCenter(position, padding) {
  const mapRef = useMapRef();

  const prevPosition = useRef<any>(null);
  const prevPadding = useRef<any>(null);
  // Handle map position easing (for both map padding and markers)
  useEffect(() => {
    console.warn(
      "Using deprecated function useMapEaseToCenter, consider using useMapEaseTo instead"
    );
    const map = mapRef.current;
    if (map == null) return;
    let opts: mapboxgl.FlyToOptions = null;
    if (position != prevPosition.current) {
      opts ??= {};
      opts.center = position;
    }
    if (padding != prevPadding.current) {
      opts ??= {};
      opts.padding = padding;
    }
    if (opts == null) return;
    if (prevPadding.current == null) {
      opts.duration = 0;
    } else {
      opts.duration = 800;
    }
    map.flyTo(opts);
    map.once("moveend", () => {
      /* Waiting until moveend to update the refs allows us to
      batch overlapping movements together, which increases UI
      smoothness when, e.g., flying to new panels */
      prevPosition.current = position;
      prevPadding.current = padding;
    });
  }, [position, padding, mapRef.current]);
}

/**
 * Ease the map to a set of bounds, with optional padding.
 * @deprecated Use useMapEaseTo instead
 */
export function useMapEaseToBounds(
  bounds: LngLatBoundsLike,
  padding: PaddingOptions | number = 0
) {
  const mapRef = useMapRef();

  const prevPosition = useRef<any>(null);
  const prevPadding = useRef<any>(null);
  // Handle map position easing (for both map padding and markers)
  useEffect(() => {
    console.warn(
      "Using deprecated function useMapEaseToBounds, consider using useMapEaseTo instead"
    );
    const map = mapRef.current;
    if (map == null) return;
    if (bounds == prevPosition.current || padding == prevPadding.current) {
      return;
    }
    let opts: mapboxgl.FlyToOptions = {
      padding,
      duration: prevPadding.current == null ? 0 : 800,
    };

    map.fitBounds(bounds, opts);
    map.once("moveend", () => {
      /* Waiting until moveend to update the refs allows us to
      batch overlapping movements together, which increases UI
      smoothness when, e.g., flying to new panels */
      prevPosition.current = bounds;
      prevPadding.current = padding;
    });
  }, [bounds, padding, mapRef.current]);
}

export type MapEaseToState = {
  bounds?: LngLatBoundsLike;
  padding?: PaddingOptions | number;
  center?: LngLatLike;
  zoom?: number;
};

type MapEaseToProps = MapEaseToState & {
  duration?: number;
  trackResize?: boolean;
};

export function useMapEaseTo(props: MapEaseToProps) {
  const mapRef = useMapRef();
  const {
    bounds,
    padding,
    center,
    zoom,
    duration = 800,
    trackResize = false,
  } = props;
  const prevState = useRef<MapEaseToState | null>(null);
  /** We need an update queue to batch together updates, especially during map initialization.
   * If we don't have this, early position updates are not respected unless they are
   * controlled outside of the component. */
  const updateQueue = useRef<MapEaseToState[]>([]);
  // This forces a re-render after initialization, I guess
  const isInitialized = useMapInitialized();

  /** Handle changes to any map props */
  useEffect(() => {
    // Add the proposed update to the queue
    updateQueue.current.push({ bounds, padding, center, zoom });

    const map = mapRef.current;
    if (map == null) {
      return;
    }

    const initialized = prevState.current != null;

    const state = updateQueue.current.reduce((acc, val) => {
      return { ...acc, ...val };
    });
    updateQueue.current = [];

    const positionChanges = filterChanges(state, prevState.current);

    let opts: mapboxgl.FlyToOptions = {
      padding,
      duration: initialized ? duration : 0,
    };

    moveMap(map, positionChanges, opts);
    map.once("moveend", () => {
      prevState.current = state;
    });
  }, [bounds, padding, center, zoom, isInitialized]);

  /** Handle map resize events */
  useEffect(() => {
    const map = mapRef?.current;
    if (map == null || !props.trackResize) return;
    const cb = () => {
      if (prevState.current == null) return;
      moveMap(map, prevState.current, { duration: 0 });
    };
    map.on("resize", cb);
    return () => {
      map.off("resize", cb);
    };
  }, [trackResize, mapRef?.current]);
}

function filterChanges(
  a: MapEaseToState,
  b: MapEaseToState | null
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

function moveMap(
  map: mapboxgl.Map,
  state: MapEaseToState,
  opts: mapboxgl.FlyToOptions
) {
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
    console.log("Flying to props", props);
    map.flyTo(stripNullKeys(props));
  }
}

function greatCircleDistance(
  l1: mapboxgl.LngLatLike,
  l2: mapboxgl.LngLatLike
): number {
  // get distance in radians between l1 and l2
  const dLon = ((l2[0] - l1[0]) * Math.PI) / 180;

  // Spherical law of cosines (accurate at large distances)
  const lat1 = (l1[1] * Math.PI) / 180;
  const lat2 = (l2[1] * Math.PI) / 180;
  return Math.acos(
    Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon)
  );
}

export function getFocusState(
  map: mapboxgl.Map,
  location: mapboxgl.LngLatLike | GeoJSON.Geometry | null
): PositionFocusState | null {
  /** Determine whether the infomarker is positioned in the viewport */
  if (location == null) return null;

  const mapCenter = map.getCenter();

  if (location.hasOwnProperty("lng") && location.hasOwnProperty("lat")) {
    location = [location.lng, location.lat];
  }

  if (!(location instanceof Array)) {
    // Get geometry bounding box
    const bounds = bbox(location);
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

export function useFocusState(
  position: mapboxgl.LngLatLike | GeoJSON.Geometry
) {
  const map = useMapRef();
  const [focusState, setFocusState] = useState<PositionFocusState | null>(null);
  const isInitialized = useMapInitialized();

  useEffect(() => {
    if (map.current == null || position == null) return;
    const cb = () => {
      setFocusState(getFocusState(map.current, position));
    };
    map.current?.on("move", cb);
    cb();

    return () => {
      map.current?.off("move", cb);
    };
  }, [isInitialized, position]);

  return focusState;
}

export function isCentered(focusState: PositionFocusState) {
  return (
    focusState == PositionFocusState.CENTERED ||
    focusState == PositionFocusState.NEAR_CENTER
  );
}

function getCenterAndBestZoom(
  input:
    | [number, number]
    | GeoJSON.Geometry
    | GeoJSON.BBox
    | mapboxgl.LngLatLike
) {
  let box: GeoJSON.BBox;
  let center: [number, number] | null = null;
  let zoom: number | null = null;

  if (input instanceof Array) {
    if (input.length === 2) {
      point = input;
    } else if (input.length === 4) {
      box = input;
    }
  }

  if (input.hasOwnProperty("lat") && input.hasOwnProperty("lng")) {
    center = [input.lng, input.lat];
  }

  // If input is a geometry, get its bounding box
  if (input.hasOwnProperty("type")) {
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

export function LocationFocusButton({
  location,
  bounds,
  className,
  easeDuration = 800,
  focusState = null,
  icon = null,
  ...rest
}) {
  const map = useMapRef();

  const _icon = icon ?? (bounds == null ? "map-marker" : "detection");
  if (location == null && bounds != null) {
    location = {
      lat: (bounds[1] + bounds[3]) / 2,
      lng: (bounds[0] + bounds[2]) / 2,
    };
  }

  const defaultFocusState = useFocusState(location);
  focusState ??= defaultFocusState;
  const _isCentered = isCentered(focusState);

  return h(
    Button,
    {
      minimal: true,
      icon: _icon,
      onClick() {
        let opts = { duration: easeDuration };
        if (focusState == PositionFocusState.CENTERED) {
          map.current?.resetNorth();
        } else if (bounds != null) {
          map.current?.fitBounds(bounds, opts);
        } else if (location != null) {
          const { center, zoom } = getCenterAndBestZoom(location);
          if (center == null) {
            return;
          } else {
            opts = { ...opts, center };
          }
          if (zoom != null) {
            opts = { ...opts, zoom };
          }
          map.current?.flyTo(opts);
        } else {
          console.warn("No location or bounds provided");
        }
      },
      className: classNames(
        "recenter-button",
        className,
        classNameForFocusState(focusState),
        bounds == null ? "position" : "bounds"
      ),
      intent: intentForFocusState(focusState),
      ...rest,
    },
    [_isCentered ? null : h("span.recenter-label", "Recenter")]
  );
}
