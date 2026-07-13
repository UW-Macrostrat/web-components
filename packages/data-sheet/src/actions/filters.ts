import { Button, Menu, MenuItem, PopoverNext, Tag } from "@blueprintjs/core";
import { useMemo, useState } from "react";
import { RegionCardinality } from "@blueprintjs/table";
import h from "./toolbar.module.sass";
import { useSelector, useStoreAPI } from "../provider";
import { getSelectionCardinality } from "./selection";
import type { TableFilter } from "./types";
import type { ColumnSpec } from "../utils";
import { columnFilter } from "./column-filter";

/** Collect all available filters from global filters and column specs. */
export function collectAllFilters<T>(
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
      result.push(columnFilter(col) as TableFilter<T>);
    }
  }
  return result;
}

/** The single view-state bar: active **sorts** and **filters** shown as
 * removable tags (filters reconfigurable in place via their `filterForm`). The
 * "Add filter" button offers only **table-level** filters (no `columnKey`) and
 * only when no column is selected — per-column filters are added/configured
 * from the column header dropdown instead, so there's no redundancy. */
export function FilterBar<T>({ filters = [] }: { filters?: TableFilter<T>[] }) {
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
  if (!hasAnything) return null;

  return h("div.filter-bar", [
    h(
      "div.group.sorts",
      columnSorts.map((s) =>
        h(
          Tag,
          {
            key: `sort-${s.key}`,
            icon: s.ascending ? "sort-asc" : "sort-desc",
            intent: "primary",
            minimal: true,
            onRemove() {
              storeAPI.getState().setColumnSort(s.key, null);
            },
          },
          `${s.key}: ${s.ascending ? "Ascending" : "Descending"}`,
        ),
      ),
    ),
    h(
      "div.group.filters",
      activeFilters
        .entries()
        .map(([id, entry]) =>
          h(ActiveFilterTag, { key: id, filterId: id, entry }),
        ),
    ),
    h.if(showAdd)(AddFilterPopover, {
      filters: availableFilters,
    }),
  ]);
}

/** A single active filter displayed as a tag. Clicking opens a popover
 * for reconfiguring the filter; the remove button deactivates it. */
function ActiveFilterTag<T>({
  filterId,
  entry,
}: {
  filterId: string;
  entry: { filter: TableFilter<T>; state: any };
}) {
  const storeAPI = useStoreAPI();
  const [configOpen, setConfigOpen] = useState(false);
  const { filter, state: filterState } = entry;

  // Summarize the active filter's window (e.g. "0–250") next to its name, so
  // the tag conveys not just what is filtered but the current setting.
  const summary = filter.describeState?.(filterState);

  const tag = h(
    Tag,
    {
      icon: filter.icon ?? "filter",
      onRemove() {
        storeAPI.getState().removeFilter(filterId);
      },
      interactive: true,
      intent: "primary",
      onClick: filter.filterForm ? () => setConfigOpen(!configOpen) : undefined,
    },
    [
      filter.name,
      summary != null && summary !== ""
        ? h("span.filter-window", [": ", summary])
        : null,
    ],
  );

  if (filter.filterForm == null) return tag;

  return h(
    PopoverNext,
    {
      isOpen: configOpen,
      onClose: () => setConfigOpen(false),
      content: h("div.filter-config", [
        h.if(filter.description != null)("p.description", filter.description),
        h(filter.filterForm, {
          state: filterState,
          setState(newState) {
            storeAPI.getState().setFilter(filterId, filter, newState);
          },
        }),
      ]),
      placement: "bottom-start",
      enforceFocus: false,
      autoFocus: false,
    },
    tag,
  );
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
