import { SetStateAction, useEffect, useRef, useState } from "react";
import h from "@macrostrat/hyper";
import { createStore, StoreApi, useStore } from "zustand";
import type { Table } from "@blueprintjs/table";
import { generateColumnSpec } from "./utils";
import { createScopedStore } from "@macrostrat/data-components";
import {
  DataSheetProviderProps,
  DataSheetStore,
  VisibleCells,
} from "./types.ts";
import { createZustandStore } from "./zustand-store.ts";
import { atomWithStore } from "jotai-zustand";
export { atom } from "jotai";
import { atom } from "jotai";
import { toasterAtom } from "./notifications.ts";
import { TableAction } from "./actions";

/** Create a Jotai scoped store */
export const ctx = createScopedStore();

export const storeAPIAtom = atom<StoreApi<DataSheetStore<any>>>();

const storeWrapperAtom = atom((get) => {
  const _storeAPIAtom = get(storeAPIAtom);
  if (_storeAPIAtom == null) {
    return undefined;
  }
  return atomWithStore(_storeAPIAtom);
});

/** This is the basis for all other atoms that manipulate the store. */
export const storeAtom = atom(
  (get) => {
    const storeWrapper = get(storeWrapperAtom);
    if (storeWrapper == null) {
      return undefined;
    }
    return get(storeWrapper);
  },
  (get, set, action: SetStateAction<T>) => {
    const storeWrapper = get(storeWrapperAtom);
    if (storeWrapper == null) {
      throw new Error("Missing DataSheetProvider");
    }
    return set(storeWrapper, action);
  },
);

const initializeStoreAtom = atom(
  null,
  (get, set, payload: Partial<DataSheetStore<T>>) => {
    set(storeAtom, (state) => {
      return {
        ...state,
        ...payload,
      };
    });
  },
);

export const tableActionsAtom = atom<TableAction[]>([]);

export function DataSheetProvider<T>(props: DataSheetProviderProps<T>) {
  const { toaster, ...rest } = props;
  const [store] = useState(() => {
    return createStore<DataSheetStore<T>>(createZustandStore);
  });
  return h(
    ctx.Provider,
    {
      atoms: [
        [storeAPIAtom, store],
        [toasterAtom, toaster],
      ],
    },
    h(DataSheetProviderInner, rest),
  );
}

export function DataSheetProviderInner<T>({
  children,
  data,
  columnSpec,
  columnSpecOptions,
  editable,
  enableColumnReordering,
  defaultColumnWidth = 150,
}: DataSheetProviderProps<T>) {
  const visibleCellsRef = useRef<VisibleCells>({
    rowIndexStart: 0,
    rowIndexEnd: 0,
  });

  const tableRef = useRef<Table>(null);

  const initializeStore = ctx.useSet(initializeStoreAtom);

  // Not sure how required this initialization is
  useEffect(() => {
    initializeStore({
      columnSpec: columnSpec ?? generateColumnSpec(data, columnSpecOptions),
      editable,
      enableColumnReordering,
      data,
      defaultColumnWidth,
      tableRef,
      visibleCellsRef,
    });
  }, [data, editable, columnSpec, columnSpecOptions, enableColumnReordering]);

  return children;
}

export function useStoreAPI<T>(): StoreApi<DataSheetStore<T>> {
  const store = ctx.useValue(storeAPIAtom);
  if (!store) {
    throw new Error("Missing DataSheetProvider");
  }
  return store;
}

export function useSelector<T = any, A = any>(
  selector: (state: DataSheetStore<T> & DataSheetComputedVals) => A,
): A {
  const store = useStoreAPI<T>();
  return useStore(store, selector);
}
/** Atoms for efficient sub-selection of state */

export const columnSpecAtom = atom((get) => get(storeAtom)?.columnSpec ?? []);
