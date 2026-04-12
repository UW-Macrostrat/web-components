import { type Region, RegionCardinality } from "@blueprintjs/table";
import type { ColumnSpec } from "../utils";
import type {
  ActiveFilterEntry,
  CellEdit,
  SelectionCardinality,
  TableAction,
  TableActionContext,
  TableFilter,
} from "./types";
import type { DataSheetStore } from "../types";
import update from "immutability-helper";

/** Derive the selection cardinality from the current set of selected regions.
 * Returns "none" when there is no active selection. */
export function getSelectionCardinality(
  regions: Region[],
): RegionCardinality | null {
  if (regions == null || regions.length === 0) return null;
  const region = regions[0];
  const hasRows = region.rows != null;
  const hasCols = region.cols != null;
  if (hasRows && hasCols) return RegionCardinality.CELLS;
  if (hasRows && !hasCols) return RegionCardinality.FULL_ROWS;
  if (!hasRows && hasCols) return RegionCardinality.FULL_COLUMNS;
  return RegionCardinality.FULL_TABLE;
}

/** Filter actions to those applicable for the current selection cardinality
 * and edit mode. */
export function getApplicableActions<T>(
  actions: TableAction<T>[],
  cardinality: RegionCardinality,
  editable: boolean,
): TableAction<T>[] {
  return actions.filter((action) => {
    if (action.requiresEditable !== false && !editable) return false;
    return action.targets.includes(cardinality);
  });
}

/** Extract concrete row indices from a set of selected regions.
 * When `filteredRowIndices` is provided, visible indices are mapped
 * to actual data indices. */
export function getSelectedRowIndices(
  regions: Region[],
  filteredRowIndices?: number[] | null,
): number[] {
  if (regions == null || regions.length === 0) return [];
  const indices = new Set<number>();
  for (const region of regions) {
    if (region.rows == null) continue;
    const [start, end] = region.rows;
    for (let i = start; i <= end; i++) {
      indices.add(i);
    }
  }
  const sorted = Array.from(indices).sort((a, b) => a - b);
  if (filteredRowIndices == null) return sorted;
  return sorted
    .map((i) => filteredRowIndices[i])
    .filter((i) => i != null);
}

/** Extract column keys covered by a set of selected regions. */
export function getSelectedColumnKeys(
  regions: Region[],
  columnSpec: ColumnSpec[],
): string[] {
  if (regions == null || regions.length === 0) return [];
  const keys = new Set<string>();
  for (const region of regions) {
    if (region.cols == null) {
      // Full-row or full-table selection covers all columns
      for (const col of columnSpec) {
        keys.add(col.key);
      }
    } else {
      const [start, end] = region.cols;
      for (let i = start; i <= end; i++) {
        if (columnSpec[i]) keys.add(columnSpec[i].key);
      }
    }
  }
  return Array.from(keys);
}

/** Construct a `TableActionContext` from the current store state.
 * Call this at action-run time (not render time) to ensure
 * the context reflects the latest state.
 * @param setState - Optional store setState for direct mutation. Omit for
 *   read-only contexts (e.g., disabled checks). */
export function buildActionContext<T>(
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

  return {
    selection: state.selection,
    selectionCardinality: getSelectionCardinality(state.selection),
    data: state.data,
    updatedData: state.updatedData,
    rowStatus: state.rowStatus,
    columnSpec: state.columnSpec,
    editable: state.editable,
    getSelectedRowIndices: () =>
      getSelectedRowIndices(state.selection, getFilteredRowIndices()),
    getSelectedColumnKeys: () =>
      getSelectedColumnKeys(state.selection, state.columnSpec),
    onCellEdited: state.onCellEdited,
    editCells(edits: CellEdit[]) {
      state.setUpdatedData((updatedData: T[]) => {
        const spec: Record<number, any> = {};
        for (const { rowIndex, columnKey, value } of edits) {
          if (spec[rowIndex] == null) {
            const op = updatedData[rowIndex] != null ? "$merge" : "$set";
            spec[rowIndex] = { [op]: {} };
          }
          const opKey = Object.keys(spec[rowIndex])[0];
          spec[rowIndex][opKey][columnKey] = value;
        }
        return update(updatedData, spec);
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

/** Compute which data row indices are visible given the active filters.
 * Returns `null` when no filters are active (all rows visible). */
export function computeFilteredRowIndices<T>(
  data: T[],
  updatedData: T[],
  activeFilters: Map<string, { filter: any; state: any }>,
): number[] | null {
  if (activeFilters == null || activeFilters.size === 0) return null;
  const numRows = Math.max(data.length, updatedData.length);
  const indices: number[] = [];
  for (let i = 0; i < numRows; i++) {
    const baseRow = data[i];
    const overlay = updatedData[i];
    const row = overlay != null ? { ...baseRow, ...overlay } : baseRow;
    if (row == null) continue;
    let passes = true;
    for (const [, { filter, state }] of activeFilters) {
      if (!filter.predicate(row, state)) {
        passes = false;
        break;
      }
    }
    if (passes) indices.push(i);
  }
  return indices;
}

/** Merge global actions with column-specific actions from the selected columns.
 * Column-specific actions are extracted from `columnSpec[i].actions` for
 * each column in the current selection. */
export function mergeColumnActions<T>(
  globalActions: TableAction<T>[],
  columnSpec: ColumnSpec[],
  selection: Region[],
): TableAction<T>[] {
  const columnKeys = getSelectedColumnKeys(selection, columnSpec);
  if (columnKeys.length === 0) return globalActions;
  const columnActions: TableAction<T>[] = [];
  for (const col of columnSpec) {
    if (columnKeys.includes(col.key) && col.actions != null) {
      for (const action of col.actions as TableAction<T>[]) {
        // Avoid duplicates by id
        if (
          !globalActions.some((a) => a.id === action.id) &&
          !columnActions.some((a) => a.id === action.id)
        ) {
          columnActions.push(action);
        }
      }
    }
  }
  return [...globalActions, ...columnActions];
}

/** Collect all available filters from global filters and column specs. */
export function collectAllFilters<T>(
  globalFilters: TableFilter<T>[],
  columnSpec: ColumnSpec[],
): TableFilter<T>[] {
  const result: TableFilter<T>[] = [...globalFilters];
  for (const col of columnSpec) {
    if (col.filters != null) {
      for (const f of col.filters as TableFilter<T>[]) {
        const withKey: TableFilter<T> = { ...f, columnKey: f.columnKey ?? col.key };
        if (!result.some((r) => r.id === withKey.id)) {
          result.push(withKey);
        }
      }
    }
  }
  return result;
}

