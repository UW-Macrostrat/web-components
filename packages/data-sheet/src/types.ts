import type {
  FocusedCellCoordinates,
  Region,
  RegionCardinality,
  Table2,
} from "@blueprintjs/table";
import { ColumnSpec, ColumnSpecOptions } from "./utils";
import { OverlayToaster, Toaster } from "@blueprintjs/core";

/** A single column sort entry for client-side sorting.
 * Defined here (rather than in actions/types) to avoid circular imports. */
export interface ColumnSort {
  key: string;
  ascending: boolean;
}

export interface DataSheetCoreProps<T> {
  data: T[];
  columnSpec?: ColumnSpec[];
  editable?: boolean;
  enableColumnReordering?: boolean;
  defaultColumnWidth?: number;
}

export enum TableElementStatus {
  DELETED = "deleted",
  ADDED = "added",
}

/** Proxy stored during a copy operation, enabling backend-mediated paste
 * for lazy-loaded tables where not all data is available locally. */
export interface ClipboardProxy {
  cardinality: RegionCardinality;
  /** Source row indices (for row/cell copies) */
  rowIndices?: number[];
  /** Source column keys (for column/cell copies) */
  columnKeys?: string[];
  /** The plain text written to the clipboard, used to verify the proxy
   * is still valid on paste (i.e., clipboard hasn't been overwritten). */
  text: string;
}

export interface DataSheetState<T> {
  selection: Region[];
  columnSpec: ColumnSpec[];
  fillValueBaseCell: FocusedCellCoordinates | null;
  focusedCell: FocusedCellCoordinates | null;
  topLeftCell: FocusedCellCoordinates | null;
  /**
   * Set of row indices that have been added to the table,
   * but not yet committed to the underlying data array.
   *
   * This is used to track which rows should be reverted when
   * a "reset" action is performed.
   */
  rowStatus: TableElementStatus[];
  // Sparse data structure for updated data
  updatedData: T[];
  initialized: boolean;
  columnWidthsIndex: Map<string, number>;
  /** Active column/table filters. Keys are filter IDs, values carry the
   * filter definition and its current configuration state. */
  activeFilters: Map<string, { filter: any; state: any }>;
  /** Clipboard proxy from the last copy operation */
  clipboardProxy: ClipboardProxy | null;
  /** Visible row indices when filters are active. `null` means show all rows. */
  filteredRowIndices: number[] | null;
  /** Active column sort entries for client-side sorting. */
  columnSorts: ColumnSort[];
}

type DataSheetVals<T> = DataSheetState<T> & DataSheetCoreProps<T>;
export type StateUpdater<T> = T[] | ((state: T[]) => T[]);

export interface DataSheetStoreMain<T> extends DataSheetVals<T> {
  setSelection(selection: Region[]): void;
  onDragValue(event: MouseEvent): void;
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
  /** Activate or update a column/table filter.
   * Filter is any object satisfying `TableFilter` from the actions module. */
  setFilter(filterId: string, filter: any, filterState: any): void;
  /** Remove a filter by ID */
  removeFilter(filterId: string): void;
  /** Remove all active filters */
  clearFilters(): void;
  /** Set or clear a column sort. Pass `null` for ascending to clear. */
  setColumnSort(key: string, ascending: boolean | null): void;
  /** Remove all active column sorts */
  clearColumnSorts(): void;
  /** Store a clipboard proxy for potential backend-mediated paste */
  setClipboardProxy(proxy: ClipboardProxy | null): void;
  initialize(props: Partial<DataSheetStoreMain<T>>): void;
  onSelection(selection: Region[]): void;
  // Internal method used for infinite scrolling
  setVisibleCells(visibleCells: VisibleCells): void;
  scrollToRow(rowIndex: number): void;
  tableRef: React.MutableRefObject<Table2>;
  visibleCellsRef: React.MutableRefObject<VisibleCells>;
  columnWidthsIndex: Map<string, number>;
  defaultColumnWidth: number;
}

export type DataSheetProviderProps<T> = DataSheetCoreProps<T> & {
  children: React.ReactNode;
  columnSpecOptions?: ColumnSpecOptions<T>;
  toaster?: OverlayToaster;
};

export interface VisibleCells {
  rowIndexStart: number;
  rowIndexEnd: number;
}

export type DataSheetStore<T> = DataSheetStoreMain<T>;
