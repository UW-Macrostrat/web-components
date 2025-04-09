import { createContext, useContext, useEffect, useRef, useState } from "react";
import h from "@macrostrat/hyper";
import { createStore, StoreApi, useStore } from "zustand";
import type {
  FocusedCellCoordinates,
  Region,
  Table2,
} from "@blueprintjs/table";
import { generateColumnSpec } from "./utils";
import update, { Spec } from "immutability-helper";
import { range } from "./utils";
import React from "react";

export interface ColumnSpec {
  name: string;
  key: string;
  required?: boolean;
  isValid?: (d: any) => boolean;
  transformValue?: (d: any) => any;
  valueRenderer?: (d: any) => string | React.ReactNode;
  dataEditor?: any;
  cellComponent?: any;
  category?: string;
  editable?: boolean;
  inlineEditor?: boolean | React.ComponentType<any> | string | null;
  style?: React.CSSProperties;
}

export interface ColumnSpecOptions {
  overrides: Record<string, Partial<ColumnSpec> | string>;
  data?: any[]; // Data to use for type inference
  nRows?: number; // Number of rows to use for type inference
  omitColumns?: string[]; // Columns to omit. Takes precedence over includeColumns.
  includeColumns?: string[]; // Columns to include.
}

export interface DataSheetCoreProps<T> {
  data: T[];
  columnSpec?: ColumnSpec[];
  editable?: boolean;
  enableColumnReordering: boolean;
}

export interface DataSheetState<T> {
  selection: Region[];
  columnSpec: ColumnSpec[];
  fillValueBaseCell: FocusedCellCoordinates | null;
  focusedCell: FocusedCellCoordinates | null;
  topLeftCell: FocusedCellCoordinates | null;
  updatedData: T[];
  initialized: boolean;
}

type DataSheetVals<T> = DataSheetState<T> & DataSheetCoreProps<T>;

export interface DataSheetStore<T> extends DataSheetVals<T> {
  setSelection(selection: Region[]): void;
  onDragValue(cell: FocusedCellCoordinates | null): void;
  setUpdatedData(data: T[]): void;
  onCellEdited(rowIndex: number, columnName: string, value: any): void;
  clearSelection(): void;
  initialize(props: DataSheetCoreProps<T>): void;
  onSelection(selection: Region[]): void;
  // Internal method used for infinite scrolling
  setVisibleCells(visibleCells: VisibleCells): void;
  scrollToRow(rowIndex: number): void;
  tableRef: React.MutableRefObject<Table2>;
}

export type DataSheetProviderProps<T> = DataSheetCoreProps<T> & {
  children: React.ReactNode;
  columnSpecOptions?: ColumnSpecOptions;
};

const DataSheetContext = createContext<StoreApi<DataSheetStore<any>>>(null);

export interface VisibleCells {
  rowIndexStart: number;
  rowIndexEnd: number;
}

export function DataSheetProvider<T>({
  children,
  data,
  columnSpec,
  columnSpecOptions,
  editable,
  enableColumnReordering,
}: DataSheetProviderProps<T>) {
  const visibleCellsRef = useRef<VisibleCells>({
    rowIndexStart: 0,
    rowIndexEnd: 0,
  });

  const tableRef = useRef<Table2>(null);

  const [store] = useState(() => {
    return createStore<DataSheetStore<T>>((set) => {
      return {
        data,
        columnSpec: columnSpec ?? generateColumnSpec(data, columnSpecOptions),
        editable,
        selection: [],
        fillValueBaseCell: null,
        updatedData: [],
        focusedCell: null,
        topLeftCell: null,
        initialized: false,
        tableRef,
        // This is a placeholder
        enableColumnReordering: false,
        setSelection(selection: Region[]) {
          set(updateSelection(selection));
        },
        setUpdatedData(data: T[] | ((state: T[]) => T[])) {
          if (Array.isArray(data)) {
            set({ updatedData: data });
          } else {
            set((state) => {
              return { updatedData: data(state.updatedData) };
            });
          }
        },
        setVisibleCells(visibleCells: VisibleCells) {
          // Visible cells are used for infinite scrolling
          // Right now we don't store this in the state
          visibleCellsRef.current = visibleCells;
        },
        onDragValue(cell: FocusedCellCoordinates | null) {
          set({ fillValueBaseCell: cell });
        },
        onCellEdited(rowIndex: number, columnName: string, value: any) {
          set((state) => {
            const { editable, updatedData, data } = state;
            if (!editable) return {};
            let rowSpec: any;
            // Check to see if the new value is the same as the old one
            if (value !== data[rowIndex]?.[columnName]) {
              const rowOp = updatedData[rowIndex] != null ? "$merge" : "$set";
              rowSpec = { [rowOp]: { [columnName]: value } };
            } else {
              rowSpec = { $unset: [columnName] };
            }
            const spec: Spec<T[]> = { [rowIndex]: rowSpec };
            return { updatedData: update(updatedData, spec) };
          });
        },
        initialize(props: DataSheetCoreProps<T>) {
          set({ ...props, initialized: true });
        },
        clearSelection() {
          set((state) => {
            // Delete all selected cells
            const { selection, updatedData, columnSpec } = state;
            let spec = {};
            for (const region of selection) {
              const { cols, rows } = region;
              for (const row of range(rows)) {
                let vals = {};
                for (const col of range(cols)) {
                  const key = columnSpec[col].key;
                  vals[key] = "";
                }
                let op = updatedData[row] == null ? "$set" : "$merge";
                spec[row] = { [op]: vals };
              }
            }
            return {
              updatedData: update(updatedData, spec),
            };
          });
        },
        onSelection(selection: Region[]) {
          set((state) => {
            let spec = updateSelection(selection);
            if (state.fillValueBaseCell != null) {
              spec.updatedData = fillValues(state, selection);
            }
            return spec;
          });
        },
        onColumnsReordered(oldIndex: number, newIndex: number, length: number) {
          set((state) => {
            if (!state.enableColumnReordering) return {};
            const { columnSpec } = state;
            const newSpec = [...columnSpec];
            const removed = newSpec.splice(oldIndex, length);
            newSpec.splice(newIndex, 0, ...removed);
            return { columnSpec: newSpec };
          });
        },
        scrollToRow(rowIndex: number, columnIndex: number) {
          if (tableRef.current == null) return;
          tableRef.current.scrollToRegion({
            rows: [rowIndex, rowIndex],
          });
        },
      };
    });
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
  selector: (state: DataSheetStore<T>) => A
): A {
  const store = useStoreAPI<T>();
  return useStore(store, selector);
}

function updateSelection<T>(selection: Region[]) {
  const focusedCell = singleFocusedCell(selection);
  let spec: Partial<DataSheetState<T>> = {
    selection,
    focusedCell,
    topLeftCell: topLeftCell(selection),
  };
  if (focusedCell != null) {
    spec.fillValueBaseCell = null;
  }
  return spec;
}

export function topLeftCell(
  regions: Region[],
  requireSolitaryCell: boolean = false
): FocusedCellCoordinates | null {
  /** Top left cell of a ranged selection  */
  if (regions == null) return null;
  const [region] = regions;
  if (region == null) return null;
  const { cols, rows } = region;
  if (cols == null || rows == null) return null;
  if (requireSolitaryCell && (cols[0] !== cols[1] || rows[0] !== rows[1]))
    return null;
  return { col: cols[0], row: rows[0], focusSelectionIndex: 0 };
}

function singleFocusedCell(sel: Region[]): FocusedCellCoordinates | null {
  /** Derive a single focused cell from a selected region, if possible */
  if (sel?.length !== 1) return null;
  return topLeftCell(sel, true);
}

function fillValues<T>(state: DataSheetStore<T>, selection: Region[]) {
  const { updatedData, columnSpec, editable, fillValueBaseCell, data } = state;

  // Prepare regions by unnesting columns
  let regions = selection.map((region) => {
    const { cols, rows } = region;
    // Get the first column (maybe should be the last)
    const [col] = cols;
    return { cols: [col, col], rows };
  });

  // Fill values downwards
  if (!editable || fillValueBaseCell == null) return updatedData;
  const { col, row } = fillValueBaseCell;
  const key = columnSpec[col].key;
  const value = updatedData[row]?.[key] ?? data[row][key];
  const spec = {};
  for (const region of regions) {
    const { cols, rows } = region;
    for (const row of range(rows)) {
      let op = updatedData[row] == null ? "$set" : "$merge";
      spec[row] = { [op]: { [key]: value } };
    }
  }
  return update(updatedData, spec);
}
