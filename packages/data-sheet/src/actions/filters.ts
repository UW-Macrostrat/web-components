import {
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  PopoverNext,
  Tag,
} from "@blueprintjs/core";
import { useMemo, useState } from "react";
import h from "./toolbar.module.sass";
import { useSelector, useStoreAPI } from "../provider";
import { collectAllFilters } from "./selection";
import type { TableFilter } from "./types";

/** The single view-state bar: active **sorts** and **filters** shown as
 * removable tags (filters reconfigurable in place via their `filterForm`),
 * plus an "Add filter" popover over the available set (global + column-spec +
 * the auto-generated operator filters for `filterable` columns). This is the
 * one place active sort/filter state lives — there is no separate sort bar. */
export function FilterBar<T>({ filters = [] }: { filters?: TableFilter<T>[] }) {
  const columnSpec = useSelector((state) => state.columnSpec);
  const storeAPI = useStoreAPI();
  const activeFilters = useSelector((state) => state.activeFilters);
  const columnSorts = useSelector((state) => state.columnSorts);

  const allFilters = useMemo(
    () => collectAllFilters(filters, columnSpec),
    [filters, columnSpec],
  );

  const activeIds = useMemo(() => new Set(activeFilters.keys()), [activeFilters]);

  const availableFilters = useMemo(
    () => allFilters.filter((f) => !activeIds.has(f.id)),
    [allFilters, activeIds],
  );

  const hasAnything =
    columnSorts.length > 0 ||
    activeFilters.size > 0 ||
    availableFilters.length > 0;
  if (!hasAnything) return null;

  return h("div.filter-bar", [
    h(
      ButtonGroup,
      { minimal: true, key: "sorts" },
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
      ButtonGroup,
      { minimal: true, key: "filters" },
      Array.from(activeFilters.entries()).map(([id, entry]) =>
        h(ActiveFilterChip, { key: id, filterId: id, entry }),
      ),
    ),
    h.if(availableFilters.length > 0)(AddFilterPopover, {
      filters: availableFilters,
    }),
    // No "clear all" — each active sort/filter tag is individually removable.
  ]);
}

/** A single active filter displayed as a tag. Clicking opens a popover
 * for reconfiguring the filter; the remove button deactivates it. */
function ActiveFilterChip<T>({
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
function AddFilterPopover<T>({
  filters,
}: {
  filters: TableFilter<T>[];
}) {
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

