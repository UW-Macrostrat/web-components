import { create, StoreApi, useStore } from "zustand";
import type { ColumnGeoJSONRecordWithID } from "@macrostrat/api-types";
import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import h from "@macrostrat/hyper";
import {
  useMacrostratColumns,
  useMacrostratStore,
} from "../../../data-provider";
import { useAPIResult } from "@macrostrat/ui-components";

export interface NavigationStore {
  columns: ColumnGeoJSONRecordWithID[];
  selectedColumn: number | null;
  hoveredColumn: number | null;
  selectColumn: (columnID: number | null) => void;
  setHoveredColumn: (columnID: number | null) => void;
}

export interface NavigationProviderProps {
  projectID?: number;
  inProcess?: boolean;
  selectedColumn?: number | null;
  hoveredColumn?: number | null;
  columns?: number[] | null;
  children: ReactNode;
  onSelectColumn?: (col_id: number | null, column: any) => void;
  onHoverColumn?: (col_id: number | null, column: any) => void;
}

const NavigationStoreContext = createContext<StoreApi<NavigationStore> | null>(
  null
);

export function ColumnNavigationProvider({
  children,
  columns,
  selectedColumn,
  projectID,
  inProcess,
  onSelectColumn,
  onHoverColumn,
}: NavigationProviderProps) {
  const getColumns = useMacrostratStore((s) => s.getColumns);

  const [store] = useState(() => {
    return create<NavigationStore>((set, get): NavigationStore => {
      return {
        columns: null,
        selectedColumn: null,
        hoveredColumn: null,
        selectColumn(columnID: number | null) {
          set({ selectedColumn: columnID, hoveredColumn: null });
          const { columns } = get();
          const column = columns?.find((d) => d.id == columnID);
          onSelectColumn?.(columnID, column);
        },
        setHoveredColumn(columnID: number | null) {
          set({ hoveredColumn: columnID });
          const { columns } = get();
          const column = columns?.find((d) => d.id == columnID);
          onHoverColumn?.(columnID, column);
        },
      };
    });
  });

  // Set up the store
  /** TODO: unify handling of columns between parts of application */
  // useAsyncEffect(async () => {
  //   let _columns = columns ?? (await getColumns(projectID, inProcess));
  //   store.setState({ columns: _columns, selectedColumn });
  // }, [projectID, inProcess, columns, getColumns]);

  const newColumns = getColsData({columns});
  const _columns = columns ? newColumns : useMacrostratColumns(projectID, inProcess);

  useEffect(() => {
    if (_columns != null) {
      store.setState({ columns: _columns, selectedColumn });
    }
  }, [_columns]);
  // Update selected column if it is changed externally

  // Kind of an awkward way to do this but we need to allow the selector to run
  useEffect(() => {
    console.log("Selecting column", selectedColumn);
    const { selectColumn, selectedColumn: _internalSelectedColumn } =
      store.getState();
    if (selectedColumn == _internalSelectedColumn) {
      return;
    }
    selectColumn(selectedColumn);
  }, [selectedColumn]);

  return h(NavigationStoreContext.Provider, { value: store }, children);
}

export function useColumnNavigationStore(
  selector: (state: NavigationStore) => any
) {
  const storeApi = useContext(NavigationStoreContext);
  if (storeApi == null) {
    throw new Error("Missing ColumnNavigationProvider");
  }
  return useStore(storeApi, selector);
}

function getColsData({columns}) {
  let res = useAPIResult(
    "https://macrostrat.org/api/v2/columns?col_id=" + columns?.join(",") + "&response=long&format=geojson"
  )

  return res?.success?.data.features?.map((d) => {
    return {
      ...d,
      id: d.properties.col_id,
    };
  });
}