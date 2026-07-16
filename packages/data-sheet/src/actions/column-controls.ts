/**
 * Built-in `FULL_COLUMNS`-scoped controls — sort and filter — expressed as
 * `TableAction`s with a `render` (live control) rather than a one-shot `run`.
 * They read the single selected column from the action context and are gated
 * by the column's `sortable` / `filterable` flags. Overridable: consumers can
 * omit them, replace them, or add their own controls at any cardinality.
 */
import h from "@macrostrat/hyper";
import { RegionCardinality } from "@blueprintjs/table";
import type { TableAction } from "./types";
import type { ColumnSpec } from "../provider";
import { TableActionContext } from "./context.ts";
import {
  ColumnFilterControl,
  ColumnFilterMenu,
  ColumnSortIndicator,
  ColumnSortMenu,
} from "../components";

function selectedColumn(ctx: TableActionContext) {
  const key = ctx.getSelectedColumnKeys()[0];
  if (key == null) return null;
  return ctx.columnSpec.find((c) => c.key === key) ?? null;
}

// ---- Sort ----

/** Single-column sort control. Gated by `col.sortable`. */
export const columnSortAction: TableAction = {
  id: "column-sort",
  name: "Sort",
  icon: "sort",
  targets: [RegionCardinality.FULL_COLUMNS],
  requiresEditable: false,
  // Only a single column (within the FULL_COLUMNS target), not multi-column.
  appliesTo: (ctx) => ctx.columnKey != null,
  render(ctx) {
    const col = selectedColumn(ctx);
    if (!col?.sortable) return null;
    return h(ColumnSortIndicator, { columnKey: col.key, large: true });
  },
  renderMenuItem(ctx) {
    const col = selectedColumn(ctx);
    if (!col?.sortable) return null;
    return h(ColumnSortMenu, { columnKey: col.key, defaultLabel: "Sort" });
  },
};

/** Single-column filter control. Gated by `col.filterable`. */
export const columnFilterAction: TableAction = {
  id: "column-filter",
  name: "Filter",
  icon: "filter",
  targets: [RegionCardinality.FULL_COLUMNS],
  requiresEditable: false,
  appliesTo: (ctx) => ctx.columnKey != null,
  render(ctx) {
    const col = selectedColumn(ctx);
    if (col == null || !isColumnFilterable(col)) return null;
    return h(ColumnFilterControl, { col });
  },
  renderMenuItem(ctx) {
    const col = selectedColumn(ctx);
    if (col == null || !isColumnFilterable(col)) return null;
    return h(ColumnFilterMenu, { col });
  },
};

/** A column offers a filter when it declares `filterable`, or supplies its own
 * `filters`. */
export function isColumnFilterable(col: ColumnSpec): boolean {
  return (
    col.filterable === true ||
    typeof col.filterable === "object" ||
    (Array.isArray(col.filters) && col.filters.length > 0)
  );
}

/** The built-in column controls (sort + filter), for inclusion in `actions`. */
export const columnControlActions: TableAction[] = [
  columnFilterAction,
  columnSortAction,
];
