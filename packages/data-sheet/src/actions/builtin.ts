import { RegionCardinality } from "@blueprintjs/table";
import type { TableAction, TableActionContext } from "./types";
import { getSelectedColumnKeys, getSelectedRowIndices } from "./selection";
import update, { Spec } from "immutability-helper";

/** Delete all rows in the current selection. */
export const deleteRowsAction: TableAction = {
  id: "delete-rows",
  name: "Delete rows",
  icon: "trash",
  intent: "danger",
  targets: [RegionCardinality.FULL_ROWS],
  requiresEditable: true,
  run(ctx) {
    ctx.deleteSelectedRows();
  },
};

/** Add a new row after the current selection (or at the end of the table). */
export const addRowAction: TableAction = {
  id: "add-row",
  name: "Add row",
  icon: "plus",
  targets: [RegionCardinality.FULL_ROWS, "none"],
  requiresEditable: true,
  run(ctx) {
    ctx.addRow();
  },
};

/** Reset pending changes, scoped to the current selection.
 * - Cells / columns: reverts edited values for the selected scope
 * - Full rows: reverts edits and un-deletes rows
 * - No selection / full table: resets all changes */
export const resetChangesAction: TableAction = {
  id: "reset-changes",
  name: "Reset",
  icon: "reset",
  intent: "warning",
  targets: [
    "none",
    RegionCardinality.CELLS,
    RegionCardinality.FULL_ROWS,
    RegionCardinality.FULL_COLUMNS,
    RegionCardinality.FULL_TABLE,
  ],
  requiresEditable: true,
  disabled(ctx) {
    return ctx.updatedData.length === 0 && ctx.rowStatus.length === 0;
  },
  run(ctx) {
    const { selectionCardinality, selection } = ctx;

    // Global reset
    if (
      selectionCardinality === "none" ||
      selectionCardinality === RegionCardinality.FULL_TABLE
    ) {
      ctx.resetChanges();
      return;
    }

    // Scoped reset: revert updatedData for the targeted scope
    const columnKeys = getSelectedColumnKeys(selection, ctx.columnSpec);

    ctx.setUpdatedData((updatedData: any[]) => {
      if (selectionCardinality === RegionCardinality.FULL_ROWS) {
        // Reset entire rows — replace with undefined to clear the overlay
        const rowSet = new Set(getSelectedRowIndices(selection));
        return updatedData.map((row, i) => (rowSet.has(i) ? undefined : row));
      }
      // CELLS or FULL_COLUMNS — remove specific column keys
      const rowIndices =
        selectionCardinality === RegionCardinality.FULL_COLUMNS
          ? // Column selection: iterate all rows that have edits
            Array.from({ length: updatedData.length }, (_, i) => i)
          : getSelectedRowIndices(selection);

      const spec: Record<number, any> = {};
      for (const row of rowIndices) {
        if (updatedData[row] == null) continue;
        spec[row] = { $unset: columnKeys };
      }
      if (Object.keys(spec).length === 0) return updatedData;
      return update(updatedData, spec);
    });

    // Un-delete affected rows
    if (selectionCardinality === RegionCardinality.FULL_ROWS) {
      const rowIndices = getSelectedRowIndices(selection);
      // Return
      const rowStatus = ctx.rowStatus;
      const rowsToRemove = new Set();
      for (const row of rowIndices) {
        if (rowStatus[row] === "deleted") {
          rowStatus[row] = undefined;
        }
        if (rowStatus[row] === "added") {
          rowsToRemove.add(row);
        }
      }

      if (rowsToRemove.size > 0) {
        const spec: Spec<any[]> = {
          $splice: Array.from(rowsToRemove).map((row) => [row, 1]),
        };
        ctx.setState({
          rowStatus: update(rowStatus, spec),
          updatedData: update(ctx.updatedData, spec),
          data: update(ctx.data, spec),
        });
      }
    }
  },
};

/** The default set of built-in table actions, providing the same
 * functionality as the legacy `DataSheetEditToolbar`. */
export const defaultTableActions: TableAction[] = [
  addRowAction,
  deleteRowsAction,
  resetChangesAction,
];
