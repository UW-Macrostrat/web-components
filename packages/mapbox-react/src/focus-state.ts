/* Reporters and buttons for evaluating a feature's focus on the map. */
import { Intent, Button } from "@blueprintjs/core";
import { useMapRef } from "./context";
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
import centroid from "@turf/centroid";

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

type MapEaseToProps = {
  bounds?: LngLatBoundsLike;
  padding?: PaddingOptions | number;
  center?: LngLatLike;
  zoom?: number;
  duration?: number;
};

export function useMapEaseTo(props: MapEaseToProps) {
  const mapRef = useMapRef();
  const { bounds, padding, center, zoom, duration = 800 } = props;
  const initialized = useRef<boolean>(false);
  const target = bounds ?? { center, zoom };

  useEffect(() => {
    const map = mapRef.current;
    if (map == null) return;

    let opts: mapboxgl.FlyToOptions = {
      padding,
      duration: initialized.current ? duration : 0,
    };

    if (target == bounds) {
      map.fitBounds(bounds, opts);
    } else if (center != null || zoom != null) {
      map.flyTo({ ...target, ...opts });
    }

    map.once("moveend", () => {
      initialized.current = true;
    });
  }, [bounds, padding, center, zoom, mapRef.current]);
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
  }, [map.current, position]);

  return focusState;
}

export function isCentered(focusState: PositionFocusState) {
  return (
    focusState == PositionFocusState.CENTERED ||
    focusState == PositionFocusState.NEAR_CENTER
  );
}

function getCenterAndBestZoom(
  input: [number, number] | GeoJSON.Geometry | GeoJSON.BBox
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
  className,
  easeDuration = 800,
  focusState = null,
  ...rest
}) {
  const map = useMapRef();
  const defaultFocusState = useFocusState(location);
  focusState ??= defaultFocusState;
  const _isCentered = isCentered(focusState);

  return h(
    Button,
    {
      minimal: true,
      icon: "map-marker",
      onClick() {
        if (focusState == PositionFocusState.CENTERED) {
          map.current?.resetNorth();
        } else {
          let opts = { duration: easeDuration };
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
        }
      },
      className: classNames(
        "recenter-button",
        className,
        classNameForFocusState(focusState)
      ),
      intent: intentForFocusState(focusState),
      ...rest,
    },
    [_isCentered ? null : h("span.recenter-label", "Recenter")]
  );
}
