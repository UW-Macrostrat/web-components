/**
 * Built-in Save action. It targets every cardinality (including no selection /
 * full table), so it's present in the toolbar at all times — which keeps the
 * toolbar mounted regardless of selection, avoiding show/hide layout motion.
 * It's disabled (not hidden) when there are no pending changes. (Reset already
 * lives in `builtin.ts` as `resetChangesAction`.)
 */
import { RegionCardinality } from "@blueprintjs/table";
import { collectValidationErrors } from "../utils/validation";
import type { TableAction } from "./types";
import { TableActionContext } from "../provider";
import { SelectionCardinality } from "./selection.ts";

/** Every selection cardinality — an action targeting all of these is always
 * applicable, so the toolbar never empties out. */
export const ALL_CARDINALITIES: SelectionCardinality[] = [
  "none",
  RegionCardinality.FULL_TABLE,
  RegionCardinality.CELLS,
  RegionCardinality.FULL_ROWS,
  RegionCardinality.FULL_COLUMNS,
];

/** Whether the table has uncommitted edits (cell overlays or added/deleted
 * rows). Accepts either the store state or an action context (both carry
 * `updatedData` / `rowStatus`). */
export function hasPendingChanges(s: {
  updatedData?: any[];
  rowStatus?: readonly string[];
}): boolean {
  const edited =
    s.updatedData?.some(
      (r) => r != null && typeof r === "object" && Object.keys(r).length > 0,
    ) ?? false;
  // TableElementStatus enum values are the strings "added" / "deleted";
  // compared literally to avoid a value import (and an extra module cycle).
  const structural =
    s.rowStatus?.some((st) => st === "added" || st === "deleted") ?? false;
  return edited || structural;
}

/** Create a save action bound to a persistence handler. Always present;
 * disabled when there are no pending changes. */
export function createSaveAction<T = any>(
  onSave: (ctx: TableActionContext<T>) => void | Promise<void>,
): TableAction<T> {
  return {
    id: "save-changes",
    name: "Save",
    icon: "floppy-disk",
    intent: "primary",
    targets: ALL_CARDINALITIES,
    requiresEditable: true,
    disabled: (s: any) => !hasPendingChanges(s),
    run: (ctx) => {
      // Validation errors block saving (warnings don't). The offending cells
      // are already highlighted; refuse and surface a summary.
      const errors = collectValidationErrors(ctx as any);
      if (errors.length > 0) {
        throw new Error(
          `Cannot save: ${errors.length} validation error${
            errors.length === 1 ? "" : "s"
          }. Fix the highlighted cells.`,
        );
      }
      return onSave(ctx);
    },
  };
}
