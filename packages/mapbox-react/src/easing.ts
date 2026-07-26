import { useMapInitialized, useMapRef } from "./context.ts";
import { useEffect, useRef } from "react";
import { filterChanges, moveMap } from "@macrostrat/mapbox-utils";
import type {
  AnimationOptions,
  CameraOptions,
  LngLatBoundsLike,
  PaddingOptions,
} from "mapbox-gl";
import type { MapEaseToState } from "@macrostrat/mapbox-utils";

export { MapEaseToState };

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
      "Using deprecated function useMapEaseToCenter, consider using useMapEaseTo instead",
    );
    const map = mapRef.current;
    if (map == null) return;
    let opts: FlyToOptions = null;
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
  padding: PaddingOptions | number = 0,
) {
  const mapRef = useMapRef();

  const prevPosition = useRef<any>(null);
  const prevPadding = useRef<any>(null);
  // Handle map position easing (for both map padding and markers)
  useEffect(() => {
    console.warn(
      "Using deprecated function useMapEaseToBounds, consider using useMapEaseTo instead",
    );
    const map = mapRef.current;
    if (map == null) return;
    if (bounds == prevPosition.current || padding == prevPadding.current) {
      return;
    }
    let opts: FlyToOptions = {
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

    let opts: FlyToOptions = {
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
