import { type Region, RegionCardinality } from "@blueprintjs/table";
import type { ColumnSpec } from "../utils";
import type {
  CellEdit,
  SelectionCardinality,
  TableAction,
  TableActionContext,
} from "./types";
import type { DataSheetStore } from "../types";
import update from "immutability-helper";

/** Derive the selection cardinality from the current set of selected regions.
 * Returns "none" when there is no active selection. */
export function getSelectionCardinality(
  regions: Region[],
): SelectionCardinality {
  if (regions == null || regions.length === 0) return "none";
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
  cardinality: SelectionCardinality,
  editable: boolean,
): TableAction<T>[] {
  return actions.filter((action) => {
    if (action.requiresEditable !== false && !editable) return false;
    return action.targets.includes(cardinality);
  });
}

/** Extract concrete row indices from a set of selected regions. */
export function getSelectedRowIndices(regions: Region[]): number[] {
  if (regions == null || regions.length === 0) return [];
  const indices = new Set<number>();
  for (const region of regions) {
    if (region.rows == null) continue;
    const [start, end] = region.rows;
    for (let i = start; i <= end; i++) {
      indices.add(i);
    }
  }
  return Array.from(indices).sort((a, b) => a - b);
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
  return {
    selection: state.selection,
    selectionCardinality: getSelectionCardinality(state.selection),
    data: state.data,
    updatedData: state.updatedData,
    rowStatus: state.rowStatus,
    columnSpec: state.columnSpec,
    editable: state.editable,
    getSelectedRowIndices: () => getSelectedRowIndices(state.selection),
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
  };
}
