/** A provider that combines a Zustand store with a Jotai
 * scope. This is similar to using Zustand's own APIs, except that
 * a state context can be accessed from Jotai atoms as well.
 */

import { useMemo, useState } from "react";
import { atomWithStore } from "jotai-zustand";
import { createStore, StoreApi, type StateCreator, useStore } from "zustand";
import { AtomMap, StateIsolation } from "./scoped-store.ts";
import h from "@macrostrat/hyper";
import { atom, SetStateAction } from "jotai";

/** All of these atoms can be coordinated directly with a store */
export const zustandAPIAtom = atom<StoreApi<any>>();

const storeWrapperAtom = atom((get) => {
  const _storeAPIAtom = get(zustandAPIAtom);
  if (_storeAPIAtom == null) {
    return undefined;
  }
  return atomWithStore(_storeAPIAtom);
});

/** This is the basis for manipulating the store from Jotai.
 * It's simply a useStore wrapper that fails loudly if a Zustand
 * store isn't actually set up.
 * */
export const zustandStoreAtom = atom(
  (get) => {
    const storeWrapper = get(storeWrapperAtom);
    if (storeWrapper == null) {
      return undefined;
    }
    return get(storeWrapper);
  },
  (get, set, action: SetStateAction<any>) => {
    const storeWrapper = get(storeWrapperAtom);
    if (storeWrapper == null) {
      const debugName = get(debugNameAtom);
      throw new Error(`No ${debugName} in this scoped-store context`);
    }
    return set(storeWrapper, action);
  },
);

interface ZustandStoreProviderProps<T> {
  ctx: StateIsolation;
  initializeStore: StateCreator<T, any, any>;
  atoms?: AtomMap;
  children?: React.ReactNode;
  debugName?: string;
  /** Reuse a store from an enclosing provider, if one exists. Set to `false`
   * to nest an independent store within an existing one. */
  inherit?: boolean;
}

const debugNameAtom = atom<string>("Zustand store");

export function ZustandStoreProvider<T>(props: ZustandStoreProviderProps<T>) {
  /** A provider for a coordinated Zustand and Jotai store.
   * Right now, this is limited to a single Zustand store per Jotai
   * state isolation context. It is meant to support transition
   * to Jotai as state management infrastructure
   * */
  const { ctx, atoms, initializeStore, children, debugName, inherit } = props;
  const [storeAPI] = useState(() => {
    return createStore<T>(initializeStore);
  });

  const atomMap = useMemo(() => {
    const _existingAtoms = atoms ?? [];
    if (storeAPI == null) {
      return atoms;
    }
    return [
      [zustandAPIAtom, storeAPI],
      [debugNameAtom, debugName ?? "Zustand store"],
      ..._existingAtoms,
    ];
  }, [storeAPI, debugName, atoms]);

  return h(
    ctx.Provider,
    {
      atoms: atomMap,
      inherit,
    },
    children,
  );
}

export function useZustandSelector<S, T>(
  ctx: StateIsolation,
  selector: (state: S) => T,
): T {
  const store = useZustandStoreAPI<S>(ctx);
  return useStore(store, selector);
}

export function useZustandStoreAPI<S>(ctx: StateIsolation) {
  /** Function to get the map state object itself */
  const store = ctx.useValue(zustandAPIAtom);
  const debugName = ctx.useValue(debugNameAtom);
  if (!store) {
    throw new Error(`No ${debugName} in this scoped-store context`);
  }
  return store as StoreApi<S>;
}
