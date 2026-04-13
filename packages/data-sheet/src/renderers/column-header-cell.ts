/**
 * Column header with client-side sort and filter controls.
 *
 * Mirrors the PostgREST column header UX but operates on in-memory data.
 * Sort state is stored in the DataSheet zustand store; filtering uses the
 * existing `setFilter` / `removeFilter` mechanism with auto-generated
 * predicate filters for simple text search.
 */
import h from "@macrostrat/hyper";
import { ColumnHeaderCell } from "@blueprintjs/table";
import {
  Button,
  ButtonGroup,
  Icon,
  InputGroup,
  Menu,
  Tag as BPTag,
} from "@blueprintjs/core";
import { useCallback, useRef } from "react";
import { useSelector, useStoreAPI } from "../provider";
import type { ColumnSpec } from "../utils/column-spec";
import type { ColumnSort, TableFilter } from "../actions/types";
import type { ColumnFilterEntry, ColumnSortEntry } from "../postgrest-table";
import { ColumnHeaderActions } from "../postgrest-table/column-header";

export interface ColumnActionsConfig {
  activeSort?: ColumnSortEntry | null;
  activeFilter?: ColumnFilterEntry | null;
}

export interface ColumnHeaderRendererProps extends ColumnActionsConfig {
  col: ColumnSpec;
  colIndex: number;
  //actions: ColumnHeaderActions;
}

// ---- Auto-generated column filter helpers ----

/** Build a simple text-contains filter for a column. */
function buildAutoFilter(col: ColumnSpec): TableFilter {
  return {
    id: autoFilterId(col.key),
    name: col.name,
    columnKey: col.key,
    icon: "filter",
    defaultState: { search: "" },
    predicate(row, state) {
      if (!state?.search) return true;
      const val = String(row[col.key] ?? "").toLowerCase();
      return val.includes(state.search.toLowerCase());
    },
  };
}

/** Stable filter-ID prefix for auto-generated column filters. */
export function autoFilterId(key: string) {
  return `__col_${key}`;
}

// ---- Column header cell ----

/** Client-side column header cell with sort/filter controls.
 * Reads sort state from the store and manages column filters via
 * the existing `setFilter`/`removeFilter` store methods. */
export function renderColumnHeaderCell({
  col,
  colIndex,
  activeSort,
  activeFilter,
}: ColumnHeaderRendererProps) {
  return h(ColumnHeaderCell, { name: col.name });

  const isSortable = col.sortable === true;
  const isFilterable =
    col.filterable === true || typeof col.filterable === "object";

  if (!isSortable && !isFilterable) {
    return h(ColumnHeaderCell, { name: col.name });
  }

  const hasFilterActive =
    activeFilter != null &&
    activeFilter.state?.search !== "" &&
    activeFilter.state?.search != null;

  const hasSortActive = activeSort != null;

  return h(ColumnHeaderCell, {
    name: col.name,
    nameRenderer: () =>
      h(ColumnHeaderName, { col, hasSortActive, hasFilterActive, activeSort }),
    menuRenderer: () =>
      h(ClientColumnActionsMenu, {
        col,
        isSortable,
        isFilterable,
        activeSort,
        activeFilter,
      }),
  });
}

/** Column name with active sort/filter indicator icons. */
function ColumnHeaderName({ col, hasSortActive, hasFilterActive, activeSort }) {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", width: "100%" } },
    [
      h(
        "span",
        {
          style: {
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
        },
        col.name,
      ),
      h.if(hasSortActive || hasFilterActive)(
        "span",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "2px",
            marginLeft: "4px",
            flexShrink: 0,
          },
        },
        [
          h.if(hasSortActive)(Icon, {
            icon: activeSort?.ascending ? "sort-asc" : "sort-desc",
            size: 12,
            style: { color: "var(--intent-primary, #2965cc)" },
          }),
          h.if(hasFilterActive)(Icon, {
            icon: "filter",
            size: 12,
            style: { color: "var(--intent-warning, #d99e0b)" },
          }),
        ],
      ),
    ],
  );
}

interface ClientColumnActionsMenuProps extends ColumnActionsConfig {
  col: ColumnSpec;
  isSortable: boolean;
  isFilterable: boolean;
}

/** Menu content rendered inside ColumnHeaderCell's built-in dropdown. */
function ClientColumnActionsMenu({
  col,
  isSortable,
  isFilterable,
  activeSort,
  activeFilter,
}) {
  const storeAPI = useStoreAPI();
  const filterInputRef = useRef<HTMLInputElement>(null);

  const applyFilter = useCallback(() => {
    const val = filterInputRef.current?.value ?? "";
    const store = storeAPI.getState();
    if (val.trim() === "") {
      store.removeFilter(autoFilterId(col.key));
    } else {
      const filter = buildAutoFilter(col);
      store.setFilter(filter.id, filter, { search: val });
    }
  }, [col, storeAPI]);

  const hasAnyActive =
    activeSort != null ||
    (activeFilter != null &&
      activeFilter.state?.search !== "" &&
      activeFilter.state?.search != null);

  return h(Menu, { className: "column-actions-menu" }, [
    h("div", { style: { padding: "12px", minWidth: "220px" } }, [
      h.if(isSortable)("div", { style: { marginBottom: "12px" } }, [
        h("div", { style: sortFilterLabelStyle }, "Sort"),
        h("div", { style: { display: "flex", gap: "4px" } }, [
          h(ButtonGroup, { minimal: true }, [
            h(
              Button,
              {
                icon: "sort-asc",
                active: activeSort?.ascending === true,
                intent: activeSort?.ascending === true ? "primary" : "none",
                onClick() {
                  const store = storeAPI.getState();
                  if (activeSort?.ascending === true) {
                    store.setColumnSort(col.key, null);
                  } else {
                    store.setColumnSort(col.key, true);
                  }
                },
              },
              "A→Z",
            ),
            h(
              Button,
              {
                icon: "sort-desc",
                active: activeSort?.ascending === false,
                intent: activeSort?.ascending === false ? "primary" : "none",
                onClick() {
                  const store = storeAPI.getState();
                  if (activeSort?.ascending === false) {
                    store.setColumnSort(col.key, null);
                  } else {
                    store.setColumnSort(col.key, false);
                  }
                },
              },
              "Z→A",
            ),
          ]),
        ]),
      ]),
      h.if(isFilterable)("div", { style: { marginBottom: "12px" } }, [
        h("div", { style: sortFilterLabelStyle }, "Filter"),
        h(
          "div",
          { style: { display: "flex", gap: "4px", alignItems: "center" } },
          [
            h(InputGroup, {
              className: "filter-value-input",
              small: true,
              placeholder: "Search…",
              defaultValue: activeFilterEntry?.state?.search ?? "",
              inputRef: filterInputRef,
              onKeyDown(e) {
                if (e.key === "Enter") {
                  applyFilter();
                }
              },
              rightElement: h(Button, {
                icon: "arrow-right",
                minimal: true,
                small: true,
                onClick: applyFilter,
              }),
            }),
          ],
        ),
      ]),
      h.if(hasAnyActive)(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "flex-end",
            paddingTop: "4px",
            borderTop: "1px solid var(--divider-color, rgba(16, 22, 26, 0.15))",
          },
        },
        [
          h(
            Button,
            {
              small: true,
              minimal: true,
              intent: "danger",
              icon: "cross",
              onClick() {
                const store = storeAPI.getState();
                store.setColumnSort(col.key, null);
                store.removeFilter(autoFilterId(col.key));
                if (filterInputRef.current) {
                  filterInputRef.current.value = "";
                }
              },
            },
            "Clear all",
          ),
        ],
      ),
    ]),
  ]);
}

const sortFilterLabelStyle = {
  fontWeight: 600,
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  color: "var(--secondary-color, #5c7080)",
  marginBottom: "6px",
};

// ---- Sort/filter state bar ----

/** Bar showing active client-side sort and filter state as removable tags.
 * Rendered automatically by `_DataSheet` when sorts or column filters
 * are active. */
export function SortFilterBar() {
  const columnSorts = useSelector((state) => state.columnSorts);
  const activeFilters = useSelector((state) => state.activeFilters);
  const storeAPI = useStoreAPI();

  // Collect auto-generated column filters
  const columnFilterEntries: { key: string; search: string }[] = [];
  for (const [id, entry] of activeFilters) {
    if (id.startsWith("__col_") && entry.state?.search) {
      columnFilterEntries.push({
        key: id.replace("__col_", ""),
        search: entry.state.search,
      });
    }
  }

  const hasAnything = columnSorts.length > 0 || columnFilterEntries.length > 0;
  if (!hasAnything) return null;

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: "4px",
        marginBottom: "4px",
        alignItems: "center",
      },
    },
    [
      columnSorts.map((s) =>
        h(
          BPTag,
          {
            key: `sort-${s.key}`,
            icon: s.ascending ? "sort-asc" : "sort-desc",
            intent: "primary",
            onRemove() {
              storeAPI.getState().setColumnSort(s.key, null);
            },
            minimal: true,
          },
          `${s.key}: ${s.ascending ? "A→Z" : "Z→A"}`,
        ),
      ),
      columnFilterEntries.map((f) =>
        h(
          BPTag,
          {
            key: `filter-${f.key}`,
            icon: "filter",
            intent: "warning",
            onRemove() {
              storeAPI.getState().removeFilter(autoFilterId(f.key));
            },
            minimal: true,
          },
          `${f.key} contains "${f.search}"`,
        ),
      ),
      h(
        Button,
        {
          minimal: true,
          small: true,
          icon: "cross",
          onClick() {
            const store = storeAPI.getState();
            // Clear all column sorts
            store.clearColumnSorts();
            // Clear auto-generated column filters
            for (const [id] of activeFilters) {
              if (id.startsWith("__col_")) {
                store.removeFilter(id);
              }
            }
          },
        },
        "Clear all",
      ),
    ],
  );
}
