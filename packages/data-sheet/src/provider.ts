import { createContext, useContext, useEffect, useRef, useState } from "react";
import h from "@macrostrat/hyper";
import { createStore, StoreApi, useStore } from "zustand";
import type { Region, Table } from "@blueprintjs/table";
import { generateColumnSpec } from "./utils";
import { createScopedStore } from "@macrostrat/data-components";
import {
  DataSheetComputedVals,
  DataSheetProviderProps,
  DataSheetStore,
  DataSheetStoreMain,
  VisibleCells,
} from "./types.ts";
import {
  computed,
  createZustandStore,
  updateSelection,
} from "./zustand-store.ts";
import { atomWithStore } from "jotai-zustand";
import { atom } from "jotai";

/** Create a Jotai scoped store */
const scope = createScopedStore();
const { useAtom, useAtomValue, useSetAtom } = scope;
export { useAtom, useAtomValue, useSetAtom };

const storeAPIAtom = atom<StoreApi<DataSheetStore<any>>>();

export function DataSheetProvider<T>({
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

  const [store] = useState(() => {
    return createStore<DataSheetStore<T>>(computed(createZustandStore));
  });

  // Not sure how required this initialization is
  useEffect(() => {
    const { initialize } = store.getState();
    initialize({
      columnSpec: columnSpec ?? generateColumnSpec(data, columnSpecOptions),
      editable,
      enableColumnReordering,
      data,
      defaultColumnWidth,
      tableRef,
      visibleCellsRef,
    });
  }, [data, editable, columnSpec, columnSpecOptions, enableColumnReordering]);

  return h(
    scope.Provider,
    {
      atoms: [[storeAPIAtom, store]],
    },
    children,
  );
}

export function useStoreAPI<T>(): StoreApi<DataSheetStore<T>> {
  const store = scope.useAtomValue(storeAPIAtom);
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
