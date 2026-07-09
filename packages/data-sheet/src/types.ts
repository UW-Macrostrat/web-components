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

/** Direction of keyboard navigation between cells. */
export type NavDirection = "up" | "down" | "left" | "right";

/** A single cell assignment within a `setCells` edit. `rowIndex` is the
 * underlying data-row index (stable under sort/filter). */
export interface CellEdit {
  rowIndex: number;
  column: string;
  value: any;
}

/**
 * A structured, revertible description of a user edit. Emitted via the
 * `onEdit` hook so a consumer can capture edits as operations (and, with the
 * controlled-overlay API, own the edited state) instead of diffing
 * `updatedData`. This is the write half of the data-sheet's read/write
 * contract — the mirror of how data flows in.
 */
export type EditEvent<T = any> =
  | { type: "setCells"; cells: CellEdit[] }
  | { type: "deleteRows"; rowIndices: number[] }
  | { type: "restoreRows"; rowIndices: number[] }
  | { type: "addRow"; rowIndex: number; value: Partial<T> }
  | { type: "resetChanges" };

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

/** Property key holding a stable synthetic id on rows added in-table. Added
 * rows aren't in the data provider, so they need their own identity to survive
 * a provider re-fetch; it's carried on the row and preserved through edits. */
export const DS_ROW_ID = "__dsRowId";

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
  /** Whether selecting a cell automatically activates its surface (opens an
   * editor/detail panel and, for editors, focuses it). `"manual"` opens only
   * on click. */
  cellInteraction: "auto" | "manual";
  /** Runtime override of `cellInteraction`: while `false`, auto-activation is
   * suppressed (set by pressing Escape, re-armed by clicking a cell) so the
   * keyboard prioritizes navigation. */
  autoActivateArmed: boolean;
  /** Direction of the last keyboard navigation, used to place an editor's
   * cursor on the side the user is travelling toward. `null` after a click. */
  lastNavDirection: NavDirection | null;
  /** The table's focusable holder element; editors return focus here when the
   * cursor leaves them so arrow-key navigation resumes. */
  tableElement: HTMLElement | null;
  /** Whether the focused cell's surface (editor or detail panel) is open.
   * Owned by the store — not per-popover — so navigation, clicks, and the
   * Escape handler all agree on it. */
  cellSurfaceOpen: boolean;
  /** Optional observer called for every user edit as a structured
   * `EditEvent`, in addition to the built-in `updatedData` overlay. Lets a
   * consumer capture edits as revertible operations. */
  onEdit?: (event: EditEvent<T>) => void;
  /** Row identity for the edit overlay — stable across a provider re-sort,
   * unlike an array index. Defaults to `(row) => row?.id`; a data provider
   * supplies its own (e.g. a PostgREST identity key). Used to re-attach edits
   * when the loader replaces `data` with a re-ordered window. */
  identity: (row: any) => string | number | null | undefined;
  /** Edits/statuses held by identity for rows not currently loaded (server
   * sources), re-attached when their row next arrives. */
  pendingOverlayById: Map<
    string | number,
    { edit?: any; status?: TableElementStatus }
  >;
  /** True when the consumer controls the `updatedData`/`rowStatus` overlay; the
   * loader-boundary identity remap is skipped (the consumer owns it). */
  controlledOverlay: boolean;
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
  moveFocusedCell(direction: NavDirection): void;
  /** Suppress auto-activation until the next click (Escape enters nav mode). */
  suppressAutoActivate(): void;
  /** Re-arm auto-activation (a click re-enables auto-focus). */
  armAutoActivate(): void;
  /** Open the focused cell's surface (editor or detail panel). */
  openCellSurface(): void;
  /** Close the focused cell's surface. When `suppress` is true (the default,
   * as for Escape), auto mode also enters navigation mode (auto-activation is
   * suppressed until the next click). A click-dismiss passes `suppress: false`
   * so it just closes without changing the global mode. */
  closeCellSurface(opts?: { suppress?: boolean }): void;
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
  scrollToRow(rowIndex: number): void;
  tableRef: React.MutableRefObject<Table2>;
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
