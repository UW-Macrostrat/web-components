import type { TableAction } from "./types";

/** Delete all rows in the current selection. */
export const deleteRowsAction: TableAction = {
  id: "delete-rows",
  name: "Delete rows",
  icon: "trash",
  intent: "danger",
  targets: ["full-rows"],
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
  targets: ["full-rows", "none"],
  requiresEditable: true,
  run(ctx) {
    ctx.addRow();
  },
};

/** Reset all pending changes (edits and deletions). */
export const resetChangesAction: TableAction = {
  id: "reset-changes",
  name: "Reset",
  icon: "reset",
  intent: "warning",
  targets: ["none", "cells", "full-rows", "full-columns", "full-table"],
  requiresEditable: true,
  disabled(ctx) {
    return ctx.updatedData.length === 0 && ctx.deletedRows.size === 0;
  },
  run(ctx) {
    ctx.resetChanges();
  },
};

/** The default set of built-in table actions, providing the same
 * functionality as the legacy `DataSheetEditToolbar`. */
export const defaultTableActions: TableAction[] = [
  addRowAction,
  deleteRowsAction,
  resetChangesAction,
];

