import { create, StoreApi, useStore } from "zustand";
import type { ColumnGeoJSONRecordWithID } from "@macrostrat/api-types";
import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import h from "@macrostrat/hyper";
import {
  useMacrostratColumns,
  useMacrostratStore,
} from "@macrostrat/data-provider";

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
  columns?: ColumnGeoJSONRecordWithID[] | null;
  columnIDs?: number[] | null;
  children: ReactNode;
  onSelectColumn?: (col_id: number | null, column: any) => void;
  onHoverColumn?: (col_id: number | null, column: any) => void;
}

const NavigationStoreContext = createContext<StoreApi<NavigationStore> | null>(
  null,
);

export function ColumnNavigationProvider({
  children,
  columns,
  columnIDs,
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

  let _columns = columns ?? useMacrostratColumns(projectID, inProcess);

  // filter columns if specified
  if (columnIDs?.length > 0) {
    _columns = useMemo(() => {
      return _columns?.filter((d) => columnIDs.includes(d.properties.col_id));
    }, [columnIDs, _columns]);
  }

  useEffect(() => {
    if (_columns?.length > 0) {
      store.setState({ columns: _columns, selectedColumn });
    }
  }, [_columns]);
  // Update selected column if it is changed externally

  // Kind of an awkward way to do this but we need to allow the selector to run
  useEffect(() => {
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
  selector: (state: NavigationStore) => any,
) {
  const storeApi = useContext(NavigationStoreContext);
  if (storeApi == null) {
    throw new Error("Missing ColumnNavigationProvider");
  }
  return useStore(storeApi, selector);
}
