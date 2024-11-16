import {
  createContext,
  useContext,
  RefObject,
  useRef,
  useState,
  useMemo,
} from "react";
import update from "immutability-helper";
import { Map } from "mapbox-gl";
import h from "@macrostrat/hyper";
import { MapPosition } from "@macrostrat/mapbox-utils";
import { createStore, useStore } from "zustand";

const MapStoreContext = createContext(null);

export function MapboxMapProvider({ children }) {
  const ref = useRef<Map | null>(null);
  const [store] = useState(() => {
    return createStore<MapState>((set) => {
      return {
        status: defaultMapStatus,
        position: null,
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

function useMapStore<T>(selector: (state: MapState) => T): T {
  const store = useContext(MapStoreContext);
  if (!store) {
    throw new Error("Missing MapStoreProvider");
  }
  return useStore(store, selector);
}

interface MapState {
  status: MapStatus;
  position: MapPosition;
  ref: RefObject<Map | null>;
  dispatch(action: MapAction): void;
}

interface MapStatus {
  isLoading: boolean;
  isInitialized: boolean;
  isStyleLoaded: boolean;
}

interface MapCtx {
  status: MapStatus;
  position: MapPosition;
}

const defaultMapStatus: MapStatus = {
  isLoading: false,
  isInitialized: false,
  isStyleLoaded: false,
};

export function useMapRef() {
  return useMapStore((state) => state.ref);
}

export function useMapStatus(
  selector: (state: MapStatus) => any | null = null
) {
  return useMapStore(useSubSelector("status", selector));
}

export function useMapInitialized() {
  return useMapStore((state) => state.status.isInitialized);
}

function useSubSelector(
  key: string,
  selector: (state: any) => any | null
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
  return useMapStore((state) => state.position);
}

export function useMapElement(): Map | null {
  return useMapRef().current;
}

export const useMap = useMapElement;

export function useMapDispatch() {
  return useMapStore((state) => state.dispatch);
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
        },
      });
    case "set-loading":
      return update(state, { status: { isLoading: { $set: action.payload } } });
    case "set-initialized":
      return update(state, {
        status: { isInitialized: { $set: action.payload } },
      });
    case "set-style-loaded":
      return update(state, {
        status: { isStyleLoaded: { $set: action.payload } },
      });
    case "map-moved":
      return { ...state, position: action.payload };
  }
}
