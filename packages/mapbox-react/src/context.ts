import { RefObject, useEffect } from "react";
import { createContext, useContext, useMemo, useRef, useState } from "react";
import update from "immutability-helper";
import type {
  Map,
  StyleSpecification as MapboxStyleSpecification,
} from "mapbox-gl";
import h from "@macrostrat/hyper";
import type { MapPosition } from "@macrostrat/mapbox-utils";
import { createStore, useStore } from "zustand";

// This may or may not be defined...
import type { StyleSpecification as MaplibreStyleSpecification } from "maplibre-gl";

export type StyleSpecification =
  | MapboxStyleSpecification
  | MaplibreStyleSpecification;
export type StyleFragment = Partial<StyleSpecification> & {
  order?: number;
};

const MapStoreContext = createContext(null);

export function MapboxMapProvider({ children }) {
  const ref = useRef<Map | null>(null);
  const [store] = useState(() => {
    return createStore<MapState>((set) => {
      return {
        status: defaultMapStatus,
        position: null,
        overlayStyles: [],
        // Hold a reference to the map object in state
        ref,
        dispatch: (action: MapAction): void => {
          if (action.type === "set-map") {
            ref.current = action.payload;
          }
          set((state) => mapReducer(state, action));
        },
      };
    });
  });

  return h(MapStoreContext.Provider, { value: store }, children);
}

function internal_useMapSelector<T>(selector: (state: MapState) => T): T {
  const store = useMapStore();
  return useStore(store, selector);
}

function useMapStore() {
  /** Function to get the map state object itself */
  const store = useContext(MapStoreContext);
  if (!store) {
    throw new Error("Missing MapStoreProvider");
  }
  return store;
}

interface MapState {
  status: MapStatus;
  position: MapPosition;
  ref: RefObject<Map | null>;
  dispatch(action: MapAction): void;
  overlayStyles: StyleFragment[];
}

interface MapStatus {
  isLoading: boolean;
  isInitialized: boolean;
  isStyleLoaded: boolean;
  styleLoadedCount: number;
}

interface MapCtx {
  status: MapStatus;
  position: MapPosition;
}

const defaultMapStatus: MapStatus = {
  isLoading: false,
  isInitialized: false,
  isStyleLoaded: false,
  styleLoadedCount: 0,
};

export function useMapRef() {
  return internal_useMapSelector((state) => state.ref);
}

export function useMapStatus(
  selector: (state: MapStatus) => any | null = null,
) {
  return internal_useMapSelector(useSubSelector("status", selector));
}

export function useMapInitialized() {
  return internal_useMapSelector((state) => state.status.isInitialized);
}

function useSubSelector(
  key: string,
  selector: (state: any) => any | null,
): (state: MapState) => any {
  return useMemo(() => {
    if (selector == null) {
      return (state: MapState) => state[key];
    } else {
      return (state: MapState) => selector(state[key]);
    }
  }, [selector]);
}

export function useMapPosition() {
  return internal_useMapSelector((state) => state.position);
}

export function useMapElement(): Map | null {
  return useMapRef().current;
}

export const useMap = useMapElement;

export function useMapDispatch() {
  return internal_useMapSelector((state) => state.dispatch);
}

type MapAction =
  | { type: "set-loading"; payload: boolean }
  | { type: "set-initialized"; payload: boolean }
  | { type: "set-style-loaded"; payload: boolean }
  | { type: "map-moved"; payload: MapPosition }
  | { type: "set-map"; payload: Map };

function mapReducer(state: MapState, action: MapAction): MapCtx {
  switch (action.type) {
    case "set-map":
      return update(state, {
        status: {
          isInitialized: { $set: true },
          isStyleLoaded: { $set: false },
          styleLoadedCount: { $set: 0 },
        },
      });
    case "set-loading":
      return update(state, { status: { isLoading: { $set: action.payload } } });
    case "set-initialized":
      return update(state, {
        status: { isInitialized: { $set: action.payload } },
      });
    case "set-style-loaded":
      let spec = {
        status: { isStyleLoaded: { $set: action.payload } },
      };
      spec.status["styleLoadedCount"] = {
        $apply: (x) => {
          if (!action.payload) return x;
          return x + 1;
        },
      };
      return update(state, spec);
    case "map-moved":
      return { ...state, position: action.payload };
  }
}

export function useMapStyleFragments() {
  // Get styles added to the map via the useOverlayStyle hook
  const styles = internal_useMapSelector((state) => state.overlayStyles);
  return useMemo(() => sortStyleFragments(...styles), [styles]);
}

function sortStyleFragments(...fragments: StyleFragment[]): StyleFragment[] {
  /** Sort style fragments by their "order" property, which determines the order in which they are merged into the map style */
  return fragments
    .filter((a) => a != null)
    .sort((a, b) => {
      const aOrder = a.order ?? 0;
      const bOrder = b.order ?? 0;
      return aOrder - bOrder;
    });
}

export function useOverlayStyle(
  styleBuilder: () => StyleFragment | null,
  deps: any[] = [],
) {
  /** This hook can be used to add runtime layers to the map, even after initialization */
  const store = useMapStore();

  useEffect(() => {
    const style = styleBuilder();
    const spec = {
      overlayStyles: {
        $push: [style],
      },
    };

    store.setState((state) => update(state, spec));
    // If unmounted, remove the style from the store
    return () => {
      store.setState((state) => ({
        ...state,
        overlayStyles: state.overlayStyles.filter((s) => s !== style),
      }));
    };
  }, deps);
}
