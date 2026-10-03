/** Reuse of `mapboxgl.Map` instances across `MapView` mounts.
 *
 * Mapbox bills a map load for every `Map` constructed, while `setStyle` on an
 * existing one is free. A view drawing from a pool parks its map when it
 * unmounts, detached from the DOM, and the next view to mount adopts it rather
 * than building another — e.g. across client-side page navigations.
 *
 * Opt in by mounting a `MapPoolProvider` (or passing `pool` to a `MapView`).
 * Without one, maps are constructed and left as before. */
import h from "@macrostrat/hyper";
import { setMapPosition, type MapPosition } from "@macrostrat/mapbox-utils";
import mapboxgl from "mapbox-gl";
import { createContext, ReactNode, useContext } from "react";

import {
  defaultInitializeMap,
  defaultMapPosition,
  type MapboxOptionsExt,
} from "./initialize-map";

export interface MapPool {
  /** A parked map moved into `container`, or a new one built there. */
  acquire(container: HTMLElement, args: MapboxOptionsExt): mapboxgl.Map;
  /** Park `map` for the next `acquire`, or remove it if the pool is full. */
  release(map: mapboxgl.Map): void;
}

export interface MapPoolOptions {
  /** How many idle maps to keep. Two covers a side-by-side comparison. */
  maxParked?: number;
}

const MapPoolContext = createContext<MapPool | null>(null);

export function MapPoolProvider({
  pool,
  children,
}: {
  pool: MapPool;
  children?: ReactNode;
}) {
  return h(MapPoolContext.Provider, { value: pool }, children);
}

export function useMapPool(): MapPool | null {
  return useContext(MapPoolContext);
}

export function createMapPool({ maxParked = 2 }: MapPoolOptions = {}): MapPool {
  const parked: mapboxgl.Map[] = [];
  // Maps built with options a parked map can't take on; removed, not parked.
  const unpooled = new WeakSet<mapboxgl.Map>();

  function acquire(container: HTMLElement, args: MapboxOptionsExt) {
    const { mapPosition, style, projection, transformRequest, ...options } =
      args;

    const adoptable = Object.keys(options).every((k) => ADOPTABLE.has(k));
    let map: mapboxgl.Map | undefined;
    if (adoptable) map = parked.pop();

    if (map == null) {
      map = buildPooledMap(container, args);
      if (!adoptable) unpooled.add(map);
      return map;
    }

    container.appendChild(map.getContainer());
    map.resize();
    map.setProjection(projection ?? null);
    map.setStyle(style);
    setTransformRequest(map.getContainer(), transformRequest);
    positionAdoptedMap(map, mapPosition, options);
    return map;
  }

  function release(map: mapboxgl.Map) {
    if (unpooled.has(map) || parked.length >= maxParked) {
      map.remove();
      return;
    }
    map.stop();
    map.getContainer().remove();
    setTransformRequest(map.getContainer(), null);
    removeStrayListeners(map);
    parked.push(map);
  }

  return { acquire, release };
}

/** Constructor options a parked map can take on after the fact, plus `MapView`
 * props that reach the initializer but aren't Mapbox options. A view passing
 * anything else gets a map of its own. */
const ADOPTABLE = new Set([
  "center",
  "zoom",
  "bounds",
  "fitBoundsOptions",
  "terrainSourceID",
  "showLineSymbols",
]);

/** `MapView`'s default map, inside a child element that can be moved between
 * views. */
function buildPooledMap(container: HTMLElement, args: MapboxOptionsExt) {
  const element = document.createElement("div");
  container.appendChild(element);

  setTransformRequest(element, args.transformRequest);
  const map = defaultInitializeMap(element, {
    ...args,
    transformRequest: (url, resourceType) => {
      const fn = transformRequests.get(element);
      return fn?.(url, resourceType) ?? { url };
    },
  });
  baselineListeners.set(map, listenerSnapshot(map));
  return map;
}

/** In the order a new map applies them: `mapPosition` over `bounds` over
 * `center`. */
function positionAdoptedMap(
  map: mapboxgl.Map,
  mapPosition: MapPosition | undefined,
  options: Partial<mapboxgl.MapboxOptions>,
) {
  if (mapPosition != null) {
    setMapPosition(map, mapPosition);
    return;
  }
  if (options.bounds != null) {
    map.fitBounds(options.bounds, {
      ...options.fitBoundsOptions,
      animate: false,
    });
    return;
  }
  if (options.center != null) {
    map.jumpTo({ center: options.center, zoom: options.zoom });
    return;
  }
  setMapPosition(map, defaultMapPosition);
}

// --- Request transforms ---

// `transformRequest` is fixed at construction, so a pooled map is built with
// a dispatcher to whichever view holds it now. Keyed by container element,
// which exists before the constructor can first call it.
const transformRequests = new WeakMap<
  HTMLElement,
  mapboxgl.TransformRequestFunction
>();

function setTransformRequest(
  element: HTMLElement,
  fn: mapboxgl.TransformRequestFunction | null | undefined,
) {
  if (fn == null) {
    transformRequests.delete(element);
    return;
  }
  transformRequests.set(element, fn);
}

// --- Listener hygiene ---

// Mapbox's own listeners, as registered by the constructor. Read through the
// private `_listeners`, since a stray handler would fire on the next view.
const baselineListeners = new WeakMap<mapboxgl.Map, Map<string, Set<any>>>();

function listenerSnapshot(map: mapboxgl.Map) {
  const snapshot = new Map<string, Set<any>>();
  for (const [type, fns] of Object.entries((map as any)._listeners ?? {})) {
    snapshot.set(type, new Set(fns as any[]));
  }
  return snapshot;
}

function removeStrayListeners(map: mapboxgl.Map) {
  const baseline = baselineListeners.get(map);
  if (baseline == null) return;
  const strayTypes = new Set<string>();
  for (const [type, fns] of listenerSnapshot(map)) {
    for (const fn of fns) {
      if (baseline.get(type)?.has(fn)) continue;
      map.off(type, fn);
      strayTypes.add(type);
    }
  }
  // Not always the view's fault: Mapbox's GeolocateControl leaves a `movestart`.
  if (strayTypes.size > 0) {
    const types = [...strayTypes].join(", ");
    console.debug(`Map pool: removed listeners left on the map (${types})`);
  }
}
