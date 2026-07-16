import { Button, Menu, MenuItem, PopoverNext, Tag } from "@blueprintjs/core";
import { useMemo } from "react";
import { RegionCardinality } from "@blueprintjs/table";
import h from "./actions-toolbar.module.sass";
import { useSelector, useStoreAPI } from "../../provider";
import {
  buildMultiOperatorColumnFilter,
  getSelectionCardinality,
  type TableFilter,
} from "../../actions";
import type { ColumnSpec } from "../../utils";
import { ColumnSortIndicator, FilterIndicator } from "../indicators";

/** Collect all available filters from global filters and column specs. */
function collectAllFilters<T>(
  globalFilters: TableFilter<T>[],
  columnSpec: ColumnSpec[],
): TableFilter<T>[] {
  const result: TableFilter<T>[] = [...globalFilters];
  for (const col of columnSpec) {
    if (col.filters != null) {
      for (const f of col.filters as TableFilter<T>[]) {
        const withKey: TableFilter<T> = {
          ...f,
          columnKey: f.columnKey ?? col.key,
        };
        if (!result.some((r) => r.id === withKey.id)) {
          result.push(withKey);
        }
      }
    }
    // Auto-generate the built-in operator filter for a `filterable` column,
    // unless the column already supplies an explicit filter.
    if (col.filterable && !result.some((r) => r.columnKey === col.key)) {
      result.push(buildMultiOperatorColumnFilter(col) as TableFilter<T>);
    }
  }
  return result;
}

/** The single view-state bar: active **sorts** and **filters** shown as
 * removable tags (filters reconfigurable in place via their `filterForm`). The
 * "Add filter" button offers only **table-level** filters (no `columnKey`) and
 * only when no column is selected — per-column filters are added/configured
 * from the column header dropdown instead, so there's no redundancy. */
export function ActiveFiltersList<T>({
  filters = [],
}: {
  filters?: TableFilter<T>[];
}) {
  const columnSpec = useSelector((state) => state.columnSpec);
  const storeAPI = useStoreAPI();
  const activeFilters = useSelector((state) => state.activeFilters);
  const columnSorts = useSelector((state) => state.columnSorts);
  const selection = useSelector((state) => state.selection);

  const columnSelected =
    getSelectionCardinality(selection) === RegionCardinality.FULL_COLUMNS;

  const allFilters = useMemo(
    () => collectAllFilters(filters, columnSpec),
    [filters, columnSpec],
  );

  const activeIds = useMemo(
    () => new Set(activeFilters.keys()),
    [activeFilters],
  );

  // Only table-level filters are addable from the bar; column filters live in
  // the column header dropdown.
  const availableFilters = useMemo(
    () => allFilters.filter((f) => f.columnKey == null && !activeIds.has(f.id)),
    [allFilters, activeIds],
  );

  const showAdd = !columnSelected && availableFilters.length > 0;

  const hasAnything =
    columnSorts.length > 0 || activeFilters.size > 0 || showAdd;
  if (!hasAnything)
    return h(
      "div.filter-bar.empty",
      h("p.description", "No active filters or sorts"),
    );

  const filterArray = Array.from(activeFilters.entries()) as [
    string,
    TableFilter<T> & { state: any },
  ][];

  return h("div.filter-bar", [
    h(
      "div.group.filters",
      filterArray.map(([id, entry]) =>
        h(FilterIndicator, {
          key: id,
          ...entry,
          large: false,
          minimal: false,
          showSubject: true,
        }),
      ),
    ),
    h(
      "div.group.sorts",
      columnSorts.map((s) => {
        return h(ColumnSortIndicator, {
          columnKey: s.key,
          large: false,
          showColumnKey: true,
        });
      }),
      h.if(showAdd)(AddFilterPopover, {
        filters: availableFilters,
      }),
    ),
  ]);
}

/** Popover menu listing available (not-yet-active) filters. */
function AddFilterPopover<T>({ filters }: { filters: TableFilter<T>[] }) {
  const storeAPI = useStoreAPI();

  return h(
    PopoverNext,
    {
      content: h(
        Menu,
        filters.map((f) =>
          h(MenuItem, {
            key: f.id,
            text: f.name,
            icon: f.icon ?? "filter",
            onClick() {
              storeAPI.getState().setFilter(f.id, f, f.defaultState);
            },
          }),
        ),
      ),
      placement: "bottom-start",
    },
    h(
      Button,
      {
        minimal: true,
        small: true,
        icon: "filter",
      },
      "Add filter",
    ),
  );
}
