import { Point } from "geojson";
import { create, StoreApi, useStore } from "zustand";
import type { ColumnGeoJSONRecord } from "@macrostrat/api-types";
import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import h from "@macrostrat/hyper";
import { useAsyncEffect } from "@macrostrat/ui-components";
import { fetchAllColumns, ColumnFetchOptions } from "../../../data-fetching";

export interface NavigationStore {
  columns: ColumnGeoJSONRecord[];
  selectedColumn: number | null;
  selectColumn: (columnID: number | null) => void;
}

export interface NavigationProviderProps extends ColumnFetchOptions {
  selectedColumn?: number | null;
  columns?: ColumnGeoJSONRecord[] | null;
  children: ReactNode;
  onSelectColumn?: (column: number) => void;
}

const NavigationStoreContext = createContext<StoreApi<NavigationStore> | null>(
  null
);

export function ColumnNavigationProvider({
  children,
  columns,
  apiBaseURL = "https://macrostrat.org/api/v2",
  format,
  selectedColumn,
  projectID,
  statusCode,
  onSelectColumn,
}: NavigationProviderProps) {
  const [store] = useState(() => {
    return create<NavigationStore>((set, get): NavigationStore => {
      return {
        columns: null,
        selectedColumn: null,
        selectColumn(columnID: number | null) {
          set({ selectedColumn: columnID });
          onSelectColumn?.(columnID);
        },
      };
    });
  });

  // Set up the store
  /** TODO: unify handling of columns between parts of application */
  useAsyncEffect(async () => {
    let _columns =
      columns ??
      (await fetchAllColumns({ apiBaseURL, projectID, statusCode, format }));
    store.setState({ columns: _columns, selectedColumn });
  }, [apiBaseURL, projectID, statusCode, format, columns]);

  // Update selected colun if it is changed externally

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
  selector: (state: NavigationStore) => any
) {
  const storeApi = useContext(NavigationStoreContext);
  if (storeApi == null) {
    throw new Error("Missing ColumnNavigationProvider");
  }
  return useStore(storeApi, selector);
}

interface FocusedColumnGeoJSONRecord extends ColumnGeoJSONRecord {
  properties: {
    centroid: Point;
    nearestPointOnLine: Point;
    distanceAlongLine: number;
  } & ColumnGeoJSONRecord["properties"];
}
