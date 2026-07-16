import {
  CellEdit,
  ClipboardProxy,
  RowStatusValue,
  tableDataAtom,
} from "../provider";
import { type Region, RegionCardinality } from "@blueprintjs/table";
import update from "immutability-helper";
import {
  computeFilteredRowIndices,
  computeSelectionShape,
  getSelectedColumnKeys,
  getSelectedRowIndices,
  SelectionCardinality,
  SelectionShape,
} from "./selection.ts";
import { Getter, Setter } from "jotai";
import type { Store as JotaiStore } from "jotai/vanilla/store";
import { ctx, storeAPIAtom } from "../provider/core";
import { ColumnSpec } from "../utils";

interface ActionContextOptions {
  /** Override the action context to scope to a single column.
   This is needed for actions that are invoked for a column header
   drop-down, for instance */
  singleColumn: number;
}

type StoreInterface = Omit<JotaiStore, "sub">;

/** Context passed to an action's `run` function, providing both data access
 * and store manipulation methods. Constructed fresh at action-run time
 * to ensure current state. */
export interface TableActionContext<T = any> {
  /** Current selection regions */
  selection: Region[];
  /** Derived cardinality of the current selection */
  selectionCardinality: SelectionCardinality;
  /** Concrete shape of the current selection (cardinality + column/row counts). */
  selectionShape: SelectionShape;
  /** The single selected column's key when exactly one column is scoped
   * (a single full column, or cells within one column); otherwise `null`. */
  columnKey: string | null;
  /** The single selected data-row index when exactly one row is scoped;
   * otherwise `null`. */
  rowIndex: number | null;
  /** The single selected cell (data-row index + column key) when exactly one
   * cell is selected; otherwise `null`. Presence of these resolved fields is
   * how actions discriminate selection shape — e.g. `appliesTo: ctx =>
   * ctx.cell != null` for a single-cell control, or `ctx.columnKey != null`
   * within a `FULL_COLUMNS` target for a single-column control. */
  cell: { rowIndex: number; columnKey: string } | null;
  /** The table's base data */
  data: T[];
  /** Sparse overlay of edited data */
  updatedData: T[];
  /** Row status tracking added/deleted rows */
  rowStatus: RowStatusValue[];
  /** Column definitions */
  columnSpec: ColumnSpec[];
  /** Whether the table is in edit mode */
  editable: boolean;
  /** Whether row deletion is available (false when the provider can't delete). */
  canDeleteRows: boolean;

  // Convenience methods (derived from selection)
  /** Row indices covered by the current selection */
  getSelectedRowIndices(): number[];
  /** The selected rows as resolved objects (not indices) — the natural input
   * for an immediate-edit action. Only loaded rows are returned. */
  getSelectedRows(): T[];
  /** Column keys covered by the current selection */
  getSelectedColumnKeys(): string[];

  // Immediate-edit persistence (present when a persisting provider is wired,
  // e.g. via DataPanel). Each mutates through the provider and auto-refreshes,
  // so a selection action can edit rows without touching a `refreshToken`.
  /** Persist edited rows (upsert), then refresh. */
  saveRows?: (rows: T[]) => Promise<void>;
  /** Delete rows by identity, then refresh. */
  deleteRows?: (ids: Array<string | number>) => Promise<void>;
  /** Insert a row, then refresh. */
  insertRow?: (row: Partial<T>) => Promise<void>;
  /** Force a re-fetch from scratch. */
  refresh?: () => void;

  // Store manipulation methods
  onCellEdited(rowIndex: number, columnKey: string, value: any): void;
  /** Edit multiple cells in a single batch update. Preferred over calling
   * `onCellEdited` in a loop, which triggers separate store updates
   * and may produce inconsistent intermediate states. */
  editCells(edits: CellEdit[]): void;
  deleteSelectedRows(): void;
  addRow(row?: Partial<T>): void;
  setUpdatedData(data: any): void;
  resetChanges(region?: Region[]): void;
  clearSelection(): void;
  scrollToRow(rowIndex: number): void;
  /** Direct store mutation for cases not covered by the convenience methods
   * above (e.g., modifying `columnSpec` or `deletedRows`). */
  setState(partial: Record<string, any>): void;

  // Clipboard proxy support
  /** Active clipboard proxy from a prior copy, if any */
  clipboardProxy: ClipboardProxy | null;
  /** Store a clipboard proxy for potential backend-mediated paste */
  setClipboardProxy(proxy: ClipboardProxy | null): void;

  // Filter support
  /** Row index mapping when filters are active. When non-null,
   * visible row `i` maps to data row `filteredRowIndices[i]`. */
  filteredRowIndices: number[] | null;
}

export function useActionContext<T>(): TableActionContext {
  const store = ctx.useStore() as StoreInterface;
  return buildActionContext(store.get, store.set);
}

/** Construct a `TableActionContext` from the current store state.
 * Call this at action-run time (not render time) to ensure
 * the context reflects the latest state.
 * @param setState - Optional store setState for direct mutation. Omit for
 *   read-only contexts (e.g., disabled checks). */
export function buildActionContext<T>(
  get: Getter,
  set: Setter,
  options?: ActionContextOptions,
): TableActionContext<T> {
  const storeAPI = get(storeAPIAtom);
  if (storeAPI == null) {
    throw new Error(
      "No DataSheetProvider found in context. Wrap your component in a <DataSheetProvider>.",
    );
  }

  const data = get(tableDataAtom) as T[];

  let state = storeAPI.getState();
  if (options?.singleColumn != null) {
    const colIndex = options.singleColumn;
    state.selection = [{ cols: [colIndex, colIndex], rows: undefined }];
  }
  const setState = storeAPI.setState;

  // Lazy-compute filteredRowIndices to avoid cost during disabled checks
  let _filteredRowIndices: number[] | null | undefined = undefined;
  function getFilteredRowIndices(): number[] | null {
    if (_filteredRowIndices === undefined) {
      _filteredRowIndices = computeFilteredRowIndices(
        data,
        state.updatedData,
        state.activeFilters,
      );
    }
    return _filteredRowIndices;
  }

  const { selection, updatedData, rowStatus, rowEditing = {} } = state;

  const shape = computeSelectionShape(selection);

  return {
    selection,
    selectionCardinality: shape.cardinality,
    selectionShape: shape,
    data,
    updatedData,
    rowStatus,
    // Immediate-edit persistence, wired by the consumer (DataPanel) when a
    // persisting provider is present; each already auto-refreshes.
    ...rowEditing,
    // Resolved single-target identity (lazy — mapping rows through filters is
    // only paid when accessed).
    get columnKey() {
      return shape.columns === 1
        ? (getSelectedColumnKeys(state.selection, state.columnSpec)[0] ?? null)
        : null;
    },
    get rowIndex() {
      return shape.rows === 1
        ? (getSelectedRowIndices(state.selection, getFilteredRowIndices())[0] ??
            null)
        : null;
    },
    get cell() {
      if (
        shape.cardinality !== RegionCardinality.CELLS ||
        shape.columns !== 1 ||
        shape.rows !== 1
      ) {
        return null;
      }
      const columnKey =
        getSelectedColumnKeys(state.selection, state.columnSpec)[0] ?? null;
      const rowIndex =
        getSelectedRowIndices(state.selection, getFilteredRowIndices())[0] ??
        null;
      return columnKey != null && rowIndex != null
        ? { rowIndex, columnKey }
        : null;
    },
    columnSpec: state.columnSpec,
    editable: state.editable,
    canDeleteRows: state.canDeleteRows,
    getSelectedRowIndices: () =>
      getSelectedRowIndices(state.selection, getFilteredRowIndices()),
    getSelectedRows: () =>
      getSelectedRowIndices(state.selection, getFilteredRowIndices())
        .map((i) => data[i])
        .filter((r) => r != null),
    getSelectedColumnKeys: () =>
      getSelectedColumnKeys(state.selection, state.columnSpec),
    onCellEdited: state.onCellEdited,
    editCells(edits: CellEdit[]) {
      state.setUpdatedData((updatedData: T[]) => {
        const spec: Record<number, any> = {};
        for (const e of edits) {
          const rowIndex = e.rowIndex;
          const columnKey = (e as any).columnKey ?? e.column;
          if (spec[rowIndex] == null) {
            const op = updatedData[rowIndex] != null ? "$merge" : "$set";
            spec[rowIndex] = { [op]: {} };
          }
          const opKey = Object.keys(spec[rowIndex])[0];
          spec[rowIndex][opKey][columnKey] = e.value;
        }
        return update(updatedData, spec);
      });
      // Emit a structured edit event so controlled consumers capture programmatic
      // batch edits (clipboard paste, fill) the same as inline edits.
      state.onEdit?.({
        type: "setCells",
        cells: edits.map((e) => ({
          rowIndex: e.rowIndex,
          column: (e as any).columnKey ?? e.column,
          value: e.value,
          row: data[e.rowIndex],
        })),
      });
    },
    deleteSelectedRows: state.deleteSelectedRows,
    addRow: state.addRow,
    setUpdatedData: state.setUpdatedData,
    resetChanges: state.resetChanges,
    clearSelection: state.clearSelection,
    scrollToRow: state.scrollToRow,
    setState,
    clipboardProxy: state.clipboardProxy,
    setClipboardProxy(proxy) {
      state.setClipboardProxy(proxy);
    },
    get filteredRowIndices() {
      return getFilteredRowIndices();
    },
  };
}
