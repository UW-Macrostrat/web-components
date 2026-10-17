import { useEffect } from "react";
import type { MapEaseToState } from "@macrostrat/mapbox-utils";
import {
  filterChanges,
  getFocusState,
  moveMap,
  PositionFocusState,
} from "@macrostrat/mapbox-utils";
import type {
  AnimationOptions,
  CameraOptions,
  PaddingOptions,
} from "mapbox-gl";
import { atom, zustandStoreAtom } from "@macrostrat/scoped-store";
import { mapState } from "./context";
import { useWarning } from "@macrostrat/ui-components";
import { debounce } from "underscore";

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

type MapEaseToOptions = MapEaseToState & {
  duration?: number;
  /** Move to `center` only when it is at least this far out of focus */
  centerFrom?: PositionFocusState;
};

type MapEaseToProps = MapEaseToOptions & {
  // @deprecated
  trackResize?: boolean;
};

const hasActiveSubscriptionAtom = atom<boolean>(false);
// Requests made while held are kept, merged and settled on release
const easingHeldAtom = atom<boolean>(false);

const mapRefAtom = atom<mapboxgl.Map | null>((get) => {
  const store = get(zustandStoreAtom);
  return store.ref.current;
});

function _settleEasingRequest(get: any, set: any) {
  if (get(easingHeldAtom)) return;
  const request = get(mapEasingRequestAtom);
  const settledRequest = get(settledEasingRequestAtom);
  const map = get(mapRefAtom);
  if (map == null || request == null || settledRequest == request) return;
  const { duration = 800, centerFrom, ...rest } = request;
  if (Object.keys(rest).length === 0) return;

  const initialized = settledRequest != null;

  if (initialized && !shouldMoveToCenter(map, rest, centerFrom)) {
    setPaddingInPlace(map, rest.padding);
    set(settledEasingRequestAtom, request);
    return;
  }

  const opts: FlyToOptions = {
    // Todo: if map isn't yet initialized, go with zero
    duration: initialized ? duration : 0,
  };
  moveMap(map, rest, opts);
  set(settledEasingRequestAtom, request);
}

/** Judges the center against the padding the map is about to have */
function shouldMoveToCenter(
  map: mapboxgl.Map,
  request: MapEaseToState,
  centerFrom: PositionFocusState | undefined,
): boolean {
  if (request.center == null || centerFrom == null) return true;
  const padding = expandPadding(request.padding) ?? map.getPadding();
  const focus = getFocusState(map, request.center, padding);
  return focus == null || focus >= centerFrom;
}

/** Applies padding without moving what's on screen */
function setPaddingInPlace(
  map: mapboxgl.Map,
  _padding: PaddingOptions | number | undefined,
) {
  const padding = expandPadding(_padding);
  if (padding == null) return;
  const { clientWidth: width, clientHeight: height } = map.getContainer();
  const { top, bottom, left, right } = padding;
  const paddedCenter: [number, number] = [
    left + (width - left - right) / 2,
    top + (height - top - bottom) / 2,
  ];
  map.jumpTo({ center: map.unproject(paddedCenter), padding });
}

function expandPadding(
  padding: PaddingOptions | number | undefined,
): PaddingOptions | undefined {
  if (typeof padding !== "number") return padding;
  return { top: padding, bottom: padding, left: padding, right: padding };
}

const settleEasingRequest = debounce(_settleEasingRequest, 400);

function useMapEaseToListener() {
  /** An easing requests listener that manages the queue of easing requests
   * and settles them in order. There should only be one of these per map,
   * but duplicates will no-op. */
  const store = mapState.useStore();
  const [hasActive, setHasActive] = mapState.use(hasActiveSubscriptionAtom);
  useEffect(() => {
    if (hasActive) return;
    if (store.get(hasActiveSubscriptionAtom)) return;
    store.set(hasActiveSubscriptionAtom);
    const settle = () => settleEasingRequest(store.get, store.set);
    const unsub = store.sub(mapEasingRequestAtom, settle);
    const unsubHeld = store.sub(easingHeldAtom, settle);
    return () => {
      unsub();
      unsubHeld();
      setHasActive(false);
    };
  }, [store]);
}

const mapInitializedAtom = atom<boolean>((get) => {
  const store = get(zustandStoreAtom);
  return store.status.isInitialized;
});

const unsettledMapEasingRequestsAtom = atom<MapEaseToOptions[]>([]);
const lastSettledEasingRequestAtom = atom<MapEaseToOptions | null>(null);
const mapEasingRequestAtom = atom<Partial<MapEaseToOptions>>(
  (get) => {
    const unsettledRequests = get(unsettledMapEasingRequestsAtom);
    const settled = get(lastSettledEasingRequestAtom);
    // rely on map being initialized
    get(mapInitializedAtom);
    if (unsettledRequests.length === 0) return null;

    const state = unsettledRequests.reduce((acc, val) => {
      const val1 = pruneUndefinedKeys(val);
      const next = { ...acc, ...val1 };
      // A cutoff belongs to the request that set the center
      if (val1.center != null) next.centerFrom = val1.centerFrom;
      return next;
    }, {} as MapEaseToOptions);

    const { centerFrom, ...rest } = state;
    const changes: Partial<MapEaseToOptions> = filterChanges(rest, settled);
    if (changes.center != null) changes.centerFrom = centerFrom;
    return changes;
  },
  (get, set, request: Partial<MapEaseToOptions>) => {
    // We bundle the duration with the request but keep it out here.
    const { duration, ...rest } = request;
    const prev = get(unsettledMapEasingRequestsAtom);
    set(unsettledMapEasingRequestsAtom, [...prev, rest]);
  },
);

/** Handle map resize events */
// useEffect(() => {
//   const map = mapRef?.current;
//   if (map == null || !props.trackResize) return;
//   const cb = () => {
//     if (mapEasingState.current == null) return;
//     moveMap(map, mapEasingState.current, { duration: 0 });
//   };
//   map.on("resize", cb);
//   return () => {
//     map.off("resize", cb);
//   };
// }, [trackResize, mapRef?.current]);

function pruneUndefinedKeys<T extends object>(obj: T): Partial<T> {
  const newObj = { ...obj };
  for (const [key, val] of Object.entries(newObj)) {
    if (val === undefined) {
      delete newObj[key as keyof T];
    }
  }
  return newObj;
}

const settledEasingRequestAtom = atom<MapEaseToOptions | null>(
  (get) => get(lastSettledEasingRequestAtom),
  (get, set, request) => {
    set(unsettledMapEasingRequestsAtom, []);
    set(lastSettledEasingRequestAtom, request);
  },
);

export function useMapEaseToDispatch() {
  return mapState.useSet(mapEasingRequestAtom);
}

/** Defers moving the map while `held`, e.g. until a panel has loaded; requests
 * made meanwhile are merged and settled on release. */
export function useHoldMapEasing(held: boolean) {
  const setHeld = mapState.useSet(easingHeldAtom);
  useEffect(() => {
    setHeld(held);
    return () => setHeld(false);
  }, [held]);
}

export function useMapEaseTo(props: MapEaseToProps) {
  const {
    bounds,
    padding,
    center,
    zoom,
    duration = 800,
    trackResize,
    centerFrom,
  } = props;
  const addRequest = useMapEaseToDispatch();
  useMapEaseToListener();

  useWarning(
    "trackResize is deprecated and no longer works",
    trackResize ?? false,
  );

  /** We need an update queue to batch together updates, especially during map initialization.
   * If we don't have this, early position updates are not respected unless they are
   * controlled outside of the component. */
  // This forces a re-render after initialization, I guess
  //const isInitialized = useMapInitialized();

  /** Handle changes to any map props */
  useEffect(() => {
    // Add the proposed update to the queue
    addRequest({ bounds, padding, center, zoom, duration, centerFrom });
  }, [bounds, padding, center, zoom, duration, centerFrom]);
}
