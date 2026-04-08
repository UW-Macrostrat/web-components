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

const DataSheetContext = createContext<StoreApi<DataSheetStore<any>>>(null);

/** Create a Jotai scoped store */
const scope = createScopedStore();

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
    const spec = columnSpec || generateColumnSpec(data, columnSpecOptions);
    return createStore<DataSheetStore<T>>(
      computed((set, get): DataSheetStoreMain<T> => {
        const baseStore = createZustandStore<T>(set, get);
        return {
          ...baseStore,
          data,
          columnSpec: spec,
          defaultColumnWidth,
          editable,
          tableRef,
          visibleCellsRef,
          // This is a placeholder
          enableColumnReordering: false,
          setSelection(selection: Region[]) {
            set(updateSelection(selection));
          },
        };
      }),
    );
  });

  // Not sure how required this initialization is
  useEffect(() => {
    const { initialize } = store.getState();
    initialize({
      data,
      columnSpec: columnSpec ?? generateColumnSpec(data, columnSpecOptions),
      editable,
      enableColumnReordering,
    });
  }, [data, editable, columnSpec, columnSpecOptions, enableColumnReordering]);

  return h(DataSheetContext.Provider, { value: store }, children);
}

export function useStoreAPI<T>(): StoreApi<DataSheetStore<T>> {
  const store = useContext(DataSheetContext);
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
