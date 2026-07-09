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
import type { TableAction, TableActionContext } from "./types";
import type { ColumnSpec } from "../utils/column-spec";
import { columnFilter, ColumnFilterState } from "./column-filter";
import { OPERATOR_LABELS } from "../filters/operators";

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

function ColumnFilterControl({ col }: { col: ColumnSpec }) {
  const storeAPI = useStoreAPI();
  // The built-in operator filter for this column — the same `TableFilter` the
  // FilterBar and any server provider consume, so header and bar stay in sync.
  const filter = useMemo(() => columnFilter(col), [col.key]);
  const state = useSelector(
    (s) => s.activeFilters.get(filter.id)?.state as ColumnFilterState | undefined,
  );
  const value = state?.value ?? "";

  const setState = (next: ColumnFilterState) => {
    const store = storeAPI.getState();
    if (next == null || next.value === "" || next.value == null) {
      store.removeFilter(filter.id);
    } else {
      store.setFilter(filter.id, filter, next);
    }
  };

  const label =
    value !== "" && state != null
      ? `${OPERATOR_LABELS[state.operator] ?? state.operator} ${value}`
      : "Filter";

  return h(
    PopoverNext,
    {
      placement: "bottom-start",
      content: h(
        "div",
        { style: { padding: "6px", minWidth: "220px" } },
        h(filter.filterForm, {
          state: state ?? (filter.defaultState as ColumnFilterState),
          setState,
        }),
      ),
    },
    h(
      Button,
      {
        small: true,
        minimal: true,
        icon: "filter",
        rightIcon: "caret-down",
        intent: value !== "" ? "warning" : "none",
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
    if (!col?.filterable) return null;
    return h(ColumnFilterControl, { col });
  },
};

/** The built-in column controls (sort + filter), for inclusion in `actions`. */
export const columnControlActions: TableAction[] = [
  columnSortAction,
  columnFilterAction,
];
