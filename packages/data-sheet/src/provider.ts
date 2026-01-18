import { createContext, useContext, useEffect, useRef, useState } from "react";
import h from "@macrostrat/hyper";
import { createStore, StoreApi, useStore } from "zustand";
import { createComputed } from "zustand-computed";
import type {
  FocusedCellCoordinates,
  Region,
  Table2,
} from "@blueprintjs/table";
import {
  ColumnSpec,
  ColumnSpecOptions,
  editorKeyHandler,
  generateColumnSpec,
  range,
  tableKeyHandler,
} from "./utils";
import update, { Spec } from "immutability-helper";

export interface DataSheetCoreProps<T> {
  data: T[];
  columnSpec?: ColumnSpec[];
  editable?: boolean;
  enableColumnReordering?: boolean;
  defaultColumnWidth?: number;
}

export interface DataSheetState<T> {
  selection: Region[];
  columnSpec: ColumnSpec[];
  fillValueBaseCell: FocusedCellCoordinates | null;
  focusedCell: FocusedCellCoordinates | null;
  topLeftCell: FocusedCellCoordinates | null;
  deletedRows: Set<number>;
  // Sparse data structure for updated data
  updatedData: T[];
  initialized: boolean;
  columnWidthsIndex: Map<string, number>;
}

type DataSheetVals<T> = DataSheetState<T> & DataSheetCoreProps<T>;

type StateUpdater<T> = T[] | ((state: T[]) => T[]);

export interface DataSheetStoreMain<T> extends DataSheetVals<T> {
  setSelection(selection: Region[]): void;
  onDragValue(cell: FocusedCellCoordinates | null): void;
  setUpdatedData(data: StateUpdater<T>): void;
  onCellEdited(rowIndex: number, columnName: string, value: any): void;
  onSelectionEdited(value: any): void;
  onColumnsReordered(oldIndex: number, newIndex: number, length: number): void;
  onColumnWidthChanged(columnIndex: number, newWidth: number): void;
  moveFocusedCell(direction: "up" | "down" | "left" | "right"): void;
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
  columnWidthsIndex: Map<string, number>;
  defaultColumnWidth: number;
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

interface DataSheetComputedVals {
  hasUpdates: boolean;
  /** State for column widths (if resized).
   * This will reset if the columnSpec prop changes
   */
  columnWidths: number[];
  tableKeyHandler: (evt: React.KeyboardEvent) => void;
  editorKeyHandler: (evt: React.KeyboardEvent) => void;
  isSingleCellSelection?: boolean;
}

export type DataSheetStore<T> = DataSheetComputedVals & DataSheetStoreMain<T>;

const computed = createComputed(
  (state: DataSheetStoreMain<any>): DataSheetComputedVals => {
    const isSingleCellSelection = singleFocusedCell(state.selection) != null;
    return {
      hasUpdates: state.updatedData.length > 0 || state.deletedRows.size > 0,
      columnWidths: state.columnSpec.map(
        (col) =>
          state.columnWidthsIndex.get(col.key) ??
          col.width ??
          state.defaultColumnWidth,
      ),
      editorKeyHandler: (e: React.KeyboardEvent) =>
        editorKeyHandler(e, isSingleCellSelection),
      isSingleCellSelection,
      tableKeyHandler: (e: React.KeyboardEvent) => {
        tableKeyHandler(e, state);
      },
    };
  },
) as any;

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

  const tableRef = useRef<Table2>(null);

  const [store] = useState(() => {
    const spec = columnSpec || generateColumnSpec(data, columnSpecOptions);
    return createStore<DataSheetStore<T>>(
      computed((set): DataSheetStore<T> => {
        return {
          data,
          columnSpec: spec,
          defaultColumnWidth,
          editable,
          deletedRows: new Set<number>(),
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
          columnWidthsIndex: new Map<string, number>(),
          moveFocusedCell(direction: "up" | "down" | "left" | "right") {
            set((state) => {
              const { topLeftCell } = state;
              if (topLeftCell == null) return {};
              let { col, row } = topLeftCell;
              switch (direction) {
                case "up":
                  row = Math.max(0, row - 1);
                  break;
                case "down":
                  row = Math.min(
                    row + 1,
                    Math.max(state.data.length, state.updatedData.length) - 1,
                  );
                  break;
                case "left":
                  col = Math.max(0, col - 1);
                  break;
                case "right":
                  col = Math.min(col + 1, state.columnSpec.length - 1);
                  break;
              }
              const region: Region = { cols: [col, col], rows: [row, row] };
              return updateSelection([region]);
            });
          },
          addRow(row: Partial<T> = {} as T) {
            /** Add a new row. If there is a selection, use the last row index to determine
             * where to insert the new row. Otherwise, append to the end of the data. */
            set((state) => {
              const { updatedData, data, selection } = state;
              const lastRowIndex =
                getLastRowIndex(selection) ??
                Math.max(data.length, updatedData.length) - 1;
              // If there is a selection, insert the new row after the last selected row
              const spec: Spec<any> = {
                $splice: [[lastRowIndex + 1, 0, row]],
              };
              console.log(spec);

              return {
                updatedData: update(updatedData, spec),
              };
            });
          },
          setUpdatedData(data: StateUpdater<T>) {
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
              const { selection, deletedRows } = state;
              const rowIndices = getRowIndices(selection);

              // Delete rows from both updatedData and data
              const newDeletedRows = new Set(deletedRows);
              for (const rowIndex of rowIndices) {
                newDeletedRows.add(rowIndex);
              }

              // Remove selected rows and reset selection
              return {
                deletedRows: newDeletedRows,
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
              deletedRows: new Set<number>(),
              columnWidths: new Map<string, number>(),
              selection: [],
              focusedCell: null,
              topLeftCell: null,
              fillValueBaseCell: null,
            }));
          },
          onColumnWidthChanged(columnIx: number, newWidth: number) {
            set((state) => {
              const { columnSpec, columnWidthsIndex } = state;
              const colKey = columnSpec[columnIx].key;
              const newColumnWidths = new Map(columnWidthsIndex);
              newColumnWidths.set(colKey, newWidth);
              return { columnWidthsIndex: newColumnWidths };
            });
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
              const { selection, updatedData, columnSpec, data } = state;
              let spec = {};
              for (const region of selection) {
                console.log("Clearing region", region);
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
              if (
                selectionEquals(selection, state.selection) &&
                singleFocusedCell(selection) == null // Only if we're in a multi-cell selection mode
              ) {
                // If the selection is the same as the current selection, remove the selection.
                // In practice this only happens for whole-row and whole-column selections
                return {
                  selection: [],
                  focusedCell: null,
                  topLeftCell: null,
                  fillValueBaseCell: null,
                };
              }

              let spec = updateSelection(selection);
              if (state.fillValueBaseCell != null) {
                spec.updatedData = fillValues(state, selection);
              }
              return spec;
            });
          },
          onSelectionEdited(value: any) {
            // Apply the same value to all selected cells
            set((state) => {
              const { selection, updatedData, columnSpec, editable } = state;
              if (!editable) return {};
              let spec = {};
              for (const region of selection) {
                const { cols, rows } = region;
                const rowRange = range(rows ?? [0, updatedData.length - 1]);
                const colRange = range(cols ?? [0, columnSpec.length - 1]);
                for (const row of rowRange) {
                  let vals = {};
                  for (const col of colRange) {
                    const key = columnSpec[col].key;
                    vals[key] = value;
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
          onColumnsReordered(
            oldIndex: number,
            newIndex: number,
            length: number,
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
          scrollToRow(rowIndex: number) {
            if (tableRef.current == null) return;
            tableRef.current.scrollToRegion({
              rows: [rowIndex, rowIndex],
            });
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
  selector: (state: DataSheetStore<T> & DataSheetComputedStore) => A,
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
  requireSolitaryCell: boolean = false,
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

function selectionEquals(a: Region[], b: Region[]): boolean {
  /** Check if two selections are equal */
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const regionA = a[i];
    const regionB = b[i];

    const colsA = regionA.cols ?? [];
    const colsB = regionB.cols ?? [];

    const rowsA = regionA.rows ?? [];
    const rowsB = regionB.rows ?? [];

    if (
      colsA.length !== colsB.length ||
      rowsA.length !== rowsB.length ||
      colsA[0] !== colsB[0] ||
      colsA[1] !== colsB[1] ||
      rowsA[0] !== rowsB[0] ||
      rowsA[1] !== rowsB[1]
    ) {
      return false;
    }
  }
  return true;
}

export function singleFocusedCell(
  sel: Region[],
): FocusedCellCoordinates | null {
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
