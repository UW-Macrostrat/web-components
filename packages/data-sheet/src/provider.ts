import { createContext, useContext, useEffect, useRef, useState } from "react";
import h from "@macrostrat/hyper";
import { createStore, StoreApi, useStore } from "zustand";
import { createComputed } from "zustand-computed";
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

export interface ColumnSpecOptions<T> {
  overrides: Record<string, Partial<ColumnSpec> | string>;
  data?: T[]; // Data to use for type inference
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
  // Data before deletions and reordering
  initialData: T[];
  // Sparse data structure for updated data
  updatedData: T[];
  initialized: boolean;
}

export interface DataSheetComputedStore {
  hasUpdates: boolean;
}

type DataSheetVals<T> = DataSheetState<T> & DataSheetCoreProps<T>;

export interface DataSheetStore<T> extends DataSheetVals<T> {
  setSelection(selection: Region[]): void;
  onDragValue(cell: FocusedCellCoordinates | null): void;
  setUpdatedData(data: T[]): void;
  onCellEdited(rowIndex: number, columnName: string, value: any): void;
  deleteSelectedRows(): void;
  clearSelection(): void;
  resetChanges(): void;
  addRow(): void;
  initialize(props: DataSheetCoreProps<T>): void;
  onSelection(selection: Region[]): void;
  // Internal method used for infinite scrolling
  setVisibleCells(visibleCells: VisibleCells): void;
  scrollToRow(rowIndex: number): void;
  tableRef: React.MutableRefObject<Table2>;
}

export type DataSheetProviderProps<T> = DataSheetCoreProps<T> & {
  children: React.ReactNode;
  columnSpecOptions?: ColumnSpecOptions<T>;
};

const DataSheetContext = createContext<StoreApi<DataSheetStore<any>>>(null);

export interface VisibleCells {
  rowIndexStart: number;
  rowIndexEnd: number;
}

const computed = createComputed(
  (state: DataSheetStore<any>): DataSheetComputedStore => ({
    hasUpdates:
      state.updatedData.length > 0 || state.initialData !== state.data,
  })
) as any;

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
    return createStore<DataSheetStore<T>>(
      computed((set): DataSheetStore<T> => {
        return {
          data,
          initialData: data,
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
          addRow(row: Partial<T> = {} as T) {
            /** Add a new row. If there is a selection, use the last row index to determine
             * where to insert the new row. Otherwise, append to the end of the data. */
            set((state) => {
              const { updatedData, data, selection } = state;
              const lastRowIndex =
                getLastRowIndex(selection) ??
                Math.max(data.length, updatedData.length) - 1;
              const newRow = row; // Create an empty row if null
              // If there is a selection, insert the new row after the last selected row
              const spec: Spec<any> = {
                $splice: [[lastRowIndex + 1, 0, newRow]],
              };
              console.log(spec);

              return {
                updatedData: update(updatedData, spec),
                data: update(data, spec),
              };
            });
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
          deleteSelectedRows() {
            // Remove selected rows from the data and updatedData arrays
            set((state) => {
              const { selection, updatedData, initialData } = state;
              const rowIndices = getRowIndices(selection);

              // Delete rows from both updatedData and data
              const newUpdatedData = updatedData.filter(
                (_, index) => !rowIndices.includes(index)
              );
              const newData = initialData.filter(
                (_, index) => !rowIndices.includes(index)
              );
              // Remove selected rows and reset selection
              return {
                updatedData: newUpdatedData,
                data: newData,
                selection: [],
                focusedCell: null,
                topLeftCell: null,
                fillValueBaseCell: null,
              };
            });
          },
          resetChanges() {
            // Reset the updated data to the initial data
            set((state) => ({
              updatedData: [],
              data: state.initialData,
              selection: [],
              focusedCell: null,
              topLeftCell: null,
              fillValueBaseCell: null,
            }));
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
            set({ ...props, initialData: props.data, initialized: true });
          },
          clearSelection() {
            set((state) => {
              // Delete all selected cells
              const { selection, updatedData, columnSpec, data } = state;
              let spec = {};
              for (const region of selection) {
                const { cols, rows } = region;
                const rowRange = range(rows ?? [0, updatedData.length - 1]);
                const colRange = range(cols ?? [0, columnSpec.length - 1]);
                for (const row of rowRange) {
                  let vals = {};
                  for (const col of colRange) {
                    const key = columnSpec[col].key;
                    const currentValue =
                      updatedData[row]?.[key] ?? data[row]?.[key];
                    if (currentValue != null && currentValue !== "") {
                      vals[key] = "";
                    }
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
          onColumnsReordered(
            oldIndex: number,
            newIndex: number,
            length: number
          ) {
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
      })
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
  selector: (state: DataSheetStore<T> & DataSheetComputedStore) => A
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

function getLastRowIndex(regions: Region[]): number | null {
  /** Get the last row index from a selection of regions */
  if (regions == null || regions.length === 0) return null;
  let lastRow = -1;
  for (const region of regions) {
    const { rows } = region;
    if (rows == null || rows.length !== 2) continue;
    lastRow = Math.max(lastRow, rows[1]);
  }
  if (lastRow < 0) {
    /** If no valid rows are found, return null */
    return null;
  }
  return lastRow;
}

function getRowIndices(regions: Region[]): number[] {
  /** Get the row indices from a selection of regions */
  if (regions == null || regions.length === 0) return [];
  const rowIndices = new Set<number>();
  for (const region of regions) {
    const { rows } = region;
    if (rows == null || rows.length !== 2) continue;
    for (let i = rows[0]; i <= rows[1]; i++) {
      rowIndices.add(i);
    }
  }
  return Array.from(rowIndices).sort((a, b) => a - b);
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
