import { useEffect } from "react";
import type { MapEaseToState } from "@macrostrat/mapbox-utils";
import { filterChanges, moveMap } from "@macrostrat/mapbox-utils";
import type { AnimationOptions, CameraOptions } from "mapbox-gl";
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
};

type MapEaseToProps = MapEaseToOptions & {
  // @deprecated
  trackResize?: boolean;
};

const hasActiveSubscriptionAtom = atom<boolean>(false);

const mapRefAtom = atom<mapboxgl.Map | null>((get) => {
  const store = get(zustandStoreAtom);
  return store.ref.current;
});

function _settleEasingRequest(get: any, set: any) {
  const request = get(mapEasingRequestAtom);
  const settledRequest = get(settledEasingRequestAtom);
  const map = get(mapRefAtom);
  if (map == null || request == null || settledRequest == request) return;
  const { duration = 800, ...rest } = request;
  if (Object.keys(rest).length === 0) return;

  const initialized = settledRequest != null;

  const opts: FlyToOptions = {
    // Todo: if map isn't yet initialized, go with zero
    duration: initialized ? duration : 0,
  };
  moveMap(map, request, opts);
  set(settledEasingRequestAtom, request);
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
    const unsub = store.sub(mapEasingRequestAtom, () => {
      settleEasingRequest(store.get, store.set);
    });
    return () => {
      unsub();
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
      return { ...acc, ...val1 };
    }, {});

    return filterChanges(state, settled);
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

export function useMapEaseTo(props: MapEaseToProps) {
  const { bounds, padding, center, zoom, duration = 800, trackResize } = props;
  const addRequest = mapState.useSet(mapEasingRequestAtom);

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
    addRequest({ bounds, padding, center, zoom, duration });
  }, [bounds, padding, center, zoom, duration]);
}
