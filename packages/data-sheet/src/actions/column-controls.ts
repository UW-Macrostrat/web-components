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
import type { TableAction, TableFilter } from "./types";
import type { ColumnSpec } from "../utils/column-spec";
import { columnFilter, columnFilterId } from "./column-filter";
import { TableActionContext } from "./context.ts";

function selectedColumn(ctx: TableActionContext) {
  const key = ctx.getSelectedColumnKeys()[0];
  if (key == null) return null;
  return ctx.columnSpec.find((c) => c.key === key) ?? null;
}

// ---- Sort ----

function ColumnSortControl({ columnKey }: { columnKey: string }) {
  const storeAPI = useStoreAPI();
  const sort = useSelector((s) =>
    s.columnSorts.find((x) => x.key === columnKey),
  );
  const set = (ascending: boolean | null) =>
    storeAPI.getState().setColumnSort(columnKey, ascending);

  const icon =
    sort == null ? "sort" : sort.ascending ? "sort-asc" : "sort-desc";
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

/** Menu-native sort: a "Sort" item whose submenu holds Ascending / Descending.
 * Clicking the *active* direction again clears the sort (toggle off) — there's
 * no explicit "Clear" item, since the active-filter/sort tag in the status bar
 * already offers direct removal. `text` overrides the parent item's label (the
 * `DataPanel` uses the column name, so its Sort menu lists one item per field). */
export function ColumnSortMenu({
  columnKey,
  text = "Sort",
}: {
  columnKey: string;
  text?: string;
}) {
  const storeAPI = useStoreAPI();
  const sort = useSelector((s) =>
    s.columnSorts.find((x) => x.key === columnKey),
  );
  const toggle = (ascending: boolean) => {
    const store = storeAPI.getState();
    // A second click on the current direction toggles the sort off.
    const next =
      sort != null && sort.ascending === ascending ? null : ascending;
    store.setColumnSort(columnKey, next);
  };
  const icon =
    sort == null ? "sort" : sort.ascending ? "sort-asc" : "sort-desc";
  return h(MenuItem, { icon, text }, [
    h(MenuItem, {
      key: "asc",
      icon: "sort-asc",
      text: "Ascending",
      active: sort?.ascending === true,
      shouldDismissPopover: false,
      onClick: () => toggle(true),
    }),
    h(MenuItem, {
      key: "desc",
      icon: "sort-desc",
      text: "Descending",
      active: sort?.ascending === false,
      shouldDismissPopover: false,
      onClick: () => toggle(false),
    }),
  ]);
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
  renderMenuItem(ctx) {
    const col = selectedColumn(ctx);
    if (!col?.sortable) return null;
    return h(ColumnSortMenu, { columnKey: col.key });
  },
};

// ---- Filter ----

/** The filter offered for a column: its own rich `TableFilter` (from
 * `col.filters`) when present — so the header matches the top bar and the rich
 * filter is prioritized — else the built-in operator `columnFilter`. */
export function resolveColumnFilter(col: ColumnSpec): TableFilter {
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
        intent: isActive ? "primary" : "none",
      },
      label,
    ),
  );
}

/** Every filter applicable to a column: its rich `col.filters` (there may be
 * several) plus the built-in operator `columnFilter` when the column is
 * `filterable` and no rich filter already targets it. The menu lists all of
 * them; the toolbar's `render` collapses to `resolveColumnFilter` (a single
 * control). */
function applicableColumnFilters(col: ColumnSpec): TableFilter[] {
  const result: TableFilter[] = [];
  const rich = (col.filters as TableFilter[] | undefined) ?? [];
  for (const f of rich) {
    result.push({ ...f, columnKey: f.columnKey ?? col.key });
  }
  const hasOwnColumnFilter = result.some((r) => r.columnKey === col.key);
  if (
    (col.filterable === true || typeof col.filterable === "object") &&
    !hasOwnColumnFilter
  ) {
    result.push(columnFilter(col));
  }
  return result;
}

/** One filter, as a menu item whose submenu carries its edit form. Active
 * filters get a warning intent and show their `describeState` summary. The
 * displayed `label` may differ from `filter.name` (e.g. the built-in operator
 * filter reads "Filter" in a column's own menu, where the column is implicit). */
export function ColumnFilterMenuItem({
  filter,
  label,
}: {
  filter: TableFilter;
  label: string;
}) {
  const storeAPI = useStoreAPI();
  const state = useSelector((s) => s.activeFilters.get(filter.id)?.state);
  const isActive = state != null;
  const summary = isActive ? filter.describeState?.(state) : null;

  const setState = (next: any) => {
    const store = storeAPI.getState();
    if (next == null || next.value === "") {
      store.removeFilter(filter.id);
    } else {
      store.setFilter(filter.id, filter, next);
    }
  };

  return h(
    MenuItem,
    {
      icon: filter.icon ?? "filter",
      text: label,
      label: summary != null ? String(summary) : undefined,
      intent: isActive ? "primary" : undefined,
      shouldDismissPopover: false,
    },
    filter.filterForm != null
      ? h(
          "div.filter-menu-form",
          { style: { padding: "6px", minWidth: "220px" } },
          h(filter.filterForm, {
            state: state ?? filter.defaultState,
            setState,
          }),
        )
      : null,
  );
}

/** Menu-native filter: one item per applicable filter, each opening its form
 * in a submenu. */
function ColumnFilterMenu({ col }: { col: ColumnSpec }) {
  const filters = useMemo(() => applicableColumnFilters(col), [col]);
  const builtinId = columnFilterId(col.key);
  return h(
    filters.map((f) =>
      h(ColumnFilterMenuItem, {
        key: f.id,
        filter: f,
        // The generic operator filter is just "Filter" in its own column's
        // menu; rich (user-provided) filters keep their descriptive names.
        label: f.id === builtinId ? "Filter" : f.name,
      }),
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
  columnSortAction,
  columnFilterAction,
];
