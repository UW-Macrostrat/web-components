import type { CellEdit, DataSheetStore, TableActionContext } from "../provider";
import { RegionCardinality } from "@blueprintjs/table";
import update from "immutability-helper";
import {
  computeFilteredRowIndices,
  computeSelectionShape,
  getSelectedColumnKeys,
  getSelectedRowIndices,
} from "./selection.ts";
import { Getter, Setter } from "jotai";
import type { Store as JotaiStore } from "jotai/vanilla/store";
import { storeAPIAtom, ctx } from "../provider/core";

interface ActionContextOptions {
  /** Override the action context to scope to a single column.
   This is needed for actions that are invoked for a column header
   drop-down, for instance */
  singleColumn: number;
}

type StoreInterface = Omit<JotaiStore, "sub">;

export function useActionContext<T>(): TableActionContext {
  const store = ctx.useStore() as StoreInterface;
  return buildActionContext(store.get, store.set);
}

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

  let state = storeAPI.getState();
  if (options?.singleColumn != null) {
    const colIndex = options.singleColumn;
    state.selection = [{ cols: [colIndex, colIndex], rows: undefined }];
  }

  return buildActionContextLegacyAPI<T>(state, storeAPI.setState);
}

/** Construct a `TableActionContext` from the current store state.
 * Call this at action-run time (not render time) to ensure
 * the context reflects the latest state.
 * @param setState - Optional store setState for direct mutation. Omit for
 *   read-only contexts (e.g., disabled checks). */
export function buildActionContextLegacyAPI<T>(
  state: DataSheetStore<T>,
  setState: (partial: Record<string, any>) => void = () => {},
): TableActionContext<T> {
  // Lazy-compute filteredRowIndices to avoid cost during disabled checks
  let _filteredRowIndices: number[] | null | undefined = undefined;
  function getFilteredRowIndices(): number[] | null {
    if (_filteredRowIndices === undefined) {
      _filteredRowIndices = computeFilteredRowIndices(
        state.data,
        state.updatedData,
        state.activeFilters,
      );
    }
    return _filteredRowIndices;
  }

  const { selection, data, updatedData, rowStatus, rowEditing = {} } = state;

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
        .map((i) => state.data[i])
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
          row: state.data[e.rowIndex],
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
