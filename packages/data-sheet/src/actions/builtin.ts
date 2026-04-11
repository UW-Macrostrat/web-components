import { RegionCardinality } from "@blueprintjs/table";
import type { TableAction } from "./types";

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
  targets: [RegionCardinality.FULL_ROWS, RegionCardinality.FULL_TABLE],
  requiresEditable: true,
  run(ctx) {
    ctx.addRow();
  },
};

/** Reset pending changes, scoped to the current selection.
 * - Cells / columns: reverts edited values for the selected scope
 * - Full rows: reverts edits and un-deletes rows
 * - Full table: resets all changes */
export const resetChangesAction: TableAction = {
  id: "reset-changes",
  name: "Reset",
  icon: "reset",
  intent: "warning",
  targets: [
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
    const { selection } = ctx;
    ctx.resetChanges(selection);
  },
};

/** The default set of built-in table actions, providing the same
 * functionality as the legacy `DataSheetEditToolbar`. */
export const defaultTableActions: TableAction[] = [
  addRowAction,
  deleteRowsAction,
  resetChangesAction,
];
