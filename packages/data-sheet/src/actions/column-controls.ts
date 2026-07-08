/**
 * Built-in `FULL_COLUMNS`-scoped controls — sort and filter — expressed as
 * `TableAction`s with a `render` (live control) rather than a one-shot `run`.
 * They read the single selected column from the action context and are gated
 * by the column's `sortable` / `filterable` flags. Overridable: consumers can
 * omit them, replace them, or add their own controls at any cardinality.
 */
import h from "@macrostrat/hyper";
import { useEffect, useState } from "react";
import { Button, InputGroup, Menu, MenuItem, PopoverNext } from "@blueprintjs/core";
import { RegionCardinality } from "@blueprintjs/table";
import { useSelector, useStoreAPI } from "../provider";
import type { TableAction, TableActionContext } from "./types";

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

function ColumnFilterControl({
  columnKey,
  columnName,
}: {
  columnKey: string;
  columnName: string;
}) {
  const storeAPI = useStoreAPI();
  const id = `__col_${columnKey}`;
  const active = useSelector((s) => s.activeFilters.get(id)?.state?.search ?? "");
  const [val, setVal] = useState<string>(active);
  useEffect(() => setVal(active), [active]);

  const apply = (v: string) => {
    const store = storeAPI.getState();
    if (v === "") {
      store.removeFilter(id);
      return;
    }
    store.setFilter(
      id,
      {
        id,
        name: columnName,
        columnKey,
        icon: "filter",
        predicate: (row: any, st: any) =>
          String(row[columnKey] ?? "")
            .toLowerCase()
            .includes(String(st?.search ?? "").toLowerCase()),
      },
      { search: v },
    );
  };

  return h(
    PopoverNext,
    {
      placement: "bottom-start",
      content: h(
        "div",
        { style: { padding: "6px" } },
        h(InputGroup, {
          autoFocus: true,
          leftIcon: "filter",
          placeholder: `Filter ${columnName}…`,
          value: val,
          onValueChange: (v: string) => {
            setVal(v);
            apply(v);
          },
          // Clear directly from the text box.
          rightElement:
            val !== ""
              ? h(Button, {
                  icon: "cross",
                  minimal: true,
                  small: true,
                  onClick: () => {
                    setVal("");
                    apply("");
                  },
                })
              : undefined,
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
        intent: active !== "" ? "warning" : "none",
      },
      active !== "" ? `Filter: ${active}` : "Filter",
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
    return h(ColumnFilterControl, { columnKey: col.key, columnName: col.name });
  },
};

/** The built-in column controls (sort + filter), for inclusion in `actions`. */
export const columnControlActions: TableAction[] = [
  columnSortAction,
  columnFilterAction,
];
