/**
 * Built-in `FULL_COLUMNS`-scoped controls — sort and filter — expressed as
 * `TableAction`s with a `render` (live control) rather than a one-shot `run`.
 * They read the single selected column from the action context and are gated
 * by the column's `sortable` / `filterable` flags. Overridable: consumers can
 * omit them, replace them, or add their own controls at any cardinality.
 */
import h from "@macrostrat/hyper";
import { useMemo } from "react";
import { Button, Menu, MenuItem, PopoverNext } from "@blueprintjs/core";
import { RegionCardinality } from "@blueprintjs/table";
import { useSelector, useStoreAPI } from "../provider";
import type { TableAction, TableActionContext, TableFilter } from "./types";
import type { ColumnSpec } from "../utils/column-spec";
import { columnFilter } from "./column-filter";

function selectedColumn(ctx: TableActionContext) {
  const key = ctx.getSelectedColumnKeys()[0];
  if (key == null) return null;
  return ctx.columnSpec.find((c) => c.key === key) ?? null;
}

// ---- Sort ----

function ColumnSortControl({ columnKey }: { columnKey: string }) {
  const storeAPI = useStoreAPI();
  const sort = useSelector((s) => s.columnSorts.find((x) => x.key === columnKey));
  const set = (ascending: boolean | null) =>
    storeAPI.getState().setColumnSort(columnKey, ascending);

  const icon = sort == null ? "sort" : sort.ascending ? "sort-asc" : "sort-desc";
  const label =
    sort == null ? "Sort" : sort.ascending ? "Ascending" : "Descending";

  return h(
    PopoverNext,
    {
      placement: "bottom-start",
      content: h(Menu, [
        h(MenuItem, {
          key: "asc",
          text: "Ascending",
          icon: "sort-asc",
          active: sort?.ascending === true,
          onClick: () => set(true),
        }),
        h(MenuItem, {
          key: "desc",
          text: "Descending",
          icon: "sort-desc",
          active: sort?.ascending === false,
          onClick: () => set(false),
        }),
        h(MenuItem, {
          key: "clear",
          text: "Clear sort",
          icon: "cross",
          disabled: sort == null,
          onClick: () => set(null),
        }),
      ]),
    },
    h(
      Button,
      {
        small: true,
        minimal: true,
        icon,
        rightIcon: "caret-down",
        intent: sort != null ? "primary" : "none",
      },
      label,
    ),
  );
}

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
    return h(ColumnSortControl, { columnKey: col.key });
  },
};

// ---- Filter ----

/** The filter offered for a column: its own rich `TableFilter` (from
 * `col.filters`) when present — so the header matches the top bar and the rich
 * filter is prioritized — else the built-in operator `columnFilter`. */
function resolveColumnFilter(col: ColumnSpec): TableFilter {
  const rich = (col.filters as TableFilter[] | undefined)?.find(
    (f) => (f.columnKey ?? col.key) === col.key,
  );
  if (rich != null) return { ...rich, columnKey: rich.columnKey ?? col.key };
  return columnFilter(col);
}

function ColumnFilterControl({ col }: { col: ColumnSpec }) {
  const storeAPI = useStoreAPI();
  // Same `TableFilter` the FilterBar and any provider consume, so the header,
  // the bar, and the query stay in sync (rich filter prioritized).
  const filter = useMemo(() => resolveColumnFilter(col), [col]);
  const state = useSelector((s) => s.activeFilters.get(filter.id)?.state);
  const isActive = state != null;
  const summary = isActive ? filter.describeState?.(state) : null;

  const setState = (next: any) => {
    const store = storeAPI.getState();
    // An empty operator-filter value clears; otherwise activate/update.
    if (next == null || next.value === "") {
      store.removeFilter(filter.id);
    } else {
      store.setFilter(filter.id, filter, next);
    }
  };

  const label = isActive ? String(summary ?? filter.name) : "Filter";

  return h(
    PopoverNext,
    {
      placement: "bottom-start",
      content: h(
        "div",
        { style: { padding: "6px", minWidth: "220px" } },
        filter.filterForm != null
          ? h(filter.filterForm, {
              state: state ?? filter.defaultState,
              setState,
            })
          : null,
      ),
    },
    h(
      Button,
      {
        small: true,
        minimal: true,
        icon: "filter",
        rightIcon: "caret-down",
        intent: isActive ? "warning" : "none",
      },
      label,
    ),
  );
}

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
  columnSortAction,
  columnFilterAction,
];
