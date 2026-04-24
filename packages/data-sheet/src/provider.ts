import { SetStateAction, useEffect, useRef, useState } from "react";
import h from "@macrostrat/hyper";
import { createStore, StoreApi, useStore } from "zustand";
import type { Table } from "@blueprintjs/table";
import { generateColumnSpec } from "./utils";
import { createScopedStore } from "@macrostrat/data-components";
import {
  DataSheetProviderProps,
  DataSheetState,
  DataSheetStore,
} from "./types.ts";
import { createZustandStore } from "./zustand-store.ts";
import { atomWithStore } from "jotai-zustand";
import { toasterAtom } from "./notifications.ts";
import { TableAction } from "./actions";
import { atom } from "jotai";

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

export const tableDataAtom = atom(
  (get) => {
    return get(storeAtom)?.data ?? [];
  },
  (get, set, newData: any[]) => {
    set(storeAtom, (state: DataSheetState<any>): DataSheetState<any> => {
      console.log("Updating table data", newData);
      if (
        state.data.length == 0 &&
        newData.length > 0 &&
        state.columnSpec.length == 0
      ) {
        console.log("Generating column spec from data");
        /** We haven't yet generated the column spec, and we need to do so. TODO: we may be able to forestall this with loading state */
        return {
          ...state,
          columnSpec: generateColumnSpec(newData, state.columnSpecOptions),
          data: newData,
        };
      }

      return {
        ...state,
        data: newData,
      };
    });
  },
);
