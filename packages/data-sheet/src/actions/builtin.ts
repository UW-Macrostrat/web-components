import { RegionCardinality } from "@blueprintjs/table";
import type { TableAction } from "./types";
import { copyAction, pasteAction, clipboardActions } from "./clipboard";

export { copyAction, pasteAction, clipboardActions };

/** Delete all rows in the current selection. Disabled when the data provider
 * can't delete (no `deleteRows`). */
export const deleteRowsAction: TableAction = {
  id: "delete-rows",
  name: "Delete rows",
  icon: "trash",
  intent: "danger",
  targets: [RegionCardinality.FULL_ROWS],
  requiresEditable: true,
  disabled: (s: any) => s?.canDeleteRows === false,
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

/** Whether there are pending changes within the selected scope (used to grey
 * out Reset). Reads the store state or an action context (both carry
 * `selection` / `columnSpec` / `updatedData` / `rowStatus`). No selection or a
 * whole-table selection considers all changes. */
function hasChangesInSelection(s: any): boolean {
  const updatedData: any[] = s.updatedData ?? [];
  const rowStatus: readonly string[] = s.rowStatus ?? [];
  const rowIsEdited = (r: any) =>
    r != null && typeof r === "object" && Object.keys(r).length > 0;

  const region = s.selection?.[0];
  const hasRows = region?.rows != null;
  const hasCols = region?.cols != null;

  // No selection or full table → any change anywhere.
  if (region == null || (!hasRows && !hasCols)) {
    return (
      updatedData.some(rowIsEdited) ||
      rowStatus.some((st) => st === "added" || st === "deleted")
    );
  }

  const colKeys: string[] | null = hasCols
    ? (s.columnSpec ?? [])
        .slice(region.cols[0], region.cols[1] + 1)
        .map((c: any) => c.key)
    : null; // null → all columns

  // Full rows: edits or added/deleted status within the selected rows.
  if (hasRows && !hasCols) {
    for (let i = region.rows[0]; i <= region.rows[1]; i++) {
      if (rowStatus[i] === "added" || rowStatus[i] === "deleted") return true;
      if (rowIsEdited(updatedData[i])) return true;
    }
    return false;
  }

  // Full columns: any row edited in the selected columns.
  if (!hasRows && hasCols) {
    return updatedData.some(
      (r) => r != null && colKeys!.some((k) => r[k] != null),
    );
  }

  // Cell range: selected rows × selected columns.
  for (let i = region.rows[0]; i <= region.rows[1]; i++) {
    const r = updatedData[i];
    if (r != null && colKeys!.some((k) => r[k] != null)) return true;
  }
  return false;
}

/** Reset pending changes, scoped to the current selection.
 * - Cells / columns: reverts edited values for the selected scope
 * - Full rows: reverts edits and un-deletes rows
 * - Full table / no selection: resets all changes */
export const resetChangesAction: TableAction = {
  id: "reset-changes",
  name: "Reset",
  group: "Editing",
  icon: "reset",
  intent: "warning",
  // Every cardinality, incl. "none" — so it's always present in the toolbar
  // (keeping it mounted). With no/blank selection it resets the whole table.
  targets: [
    "none",
    RegionCardinality.CELLS,
    RegionCardinality.FULL_ROWS,
    RegionCardinality.FULL_COLUMNS,
    RegionCardinality.FULL_TABLE,
  ],
  requiresEditable: true,
  // Greyed out unless there are changes within the applicable selection.
  disabled: (ctx) => !hasChangesInSelection(ctx),
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
