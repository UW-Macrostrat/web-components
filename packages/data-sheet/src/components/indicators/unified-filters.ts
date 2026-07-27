import {
  ALL_CARDINALITIES,
  isColumnFilterable,
  TableAction,
  TableFilter,
} from "../../actions";
import { ctx, storeAtom, useSelector } from "../../provider";
import { useMemo } from "react";
import h from "../../data-panel.module.sass";
import { Menu, Tag } from "@blueprintjs/core";
import {
  ColumnFilterMenuItem,
  ColumnSortMenu,
  InlineFilterControl,
  MenuDropdown,
  MenuInlineFilterItem,
  resolveColumnFilter,
} from "./filter-and-sort.ts";
import { atom } from "jotai";

/** A filter to surface, plus the label to show for it. */
interface FilterEntry {
  filter: TableFilter;
  label: string;
}

/**
 * Stand-in for the column-header dropdown the card list lacks. Surfaces every
 * available filter (column-declared `filterable` + any table-level `filters`)
 * and sort, honoring each filter's `presentation`:
 *  - `"inline"` → an always-visible toolbar control (its `filterForm` directly),
 *  - `"menu"` (default) → a "Filter" menu item that opens the form in a submenu,
 *  - `"menu-inline"` → the form rendered directly in the "Filter" menu.
 * Every case reuses the *same* controls and store/provider seam — only
 * placement changes. Sort still comes from the column-declared `sortable` set.
 */
export function useDataPanelControls(
  tableFilters: TableFilter[] = [],
): TableAction[] {
  const columnSpec = useSelector((s) => s.columnSpec);

  // All filters, table-level first, then column-derived (each with a label).
  const entries = useMemo<FilterEntry[]>(() => {
    const fromColumns = columnSpec
      .filter((c) => isColumnFilterable(c))
      .map((c) => ({ filter: resolveColumnFilter(c), label: c.name }));
    const fromTable = tableFilters.map((f) => ({ filter: f, label: f.name }));
    return [...fromTable, ...fromColumns];
  }, [columnSpec, tableFilters]);

  const inlineEntries = entries.filter(
    (e) => presentationOf(e.filter) === "inline",
  );
  const menuEntries = entries.filter(
    (e) => presentationOf(e.filter) !== "inline",
  );

  // Hooks first (stable order), then assemble.
  const filterMenuAction = useFilterMenuAction(menuEntries);
  const sortAction = useSortAction();

  const actions: TableAction[] = [];
  // Inline filters: one always-visible toolbar control each.
  for (const { filter } of inlineEntries) {
    actions.push({
      id: `filter:${filter.id}`,
      name: filter.name,
      icon: filter.icon,
      targets: ALL_CARDINALITIES,
      render: () => h(InlineFilterControl, { filter }),
    });
  }
  if (filterMenuAction != null) actions.push(filterMenuAction);
  if (sortAction != null) actions.push(sortAction);
  return actions;
}

function presentationOf(filter: TableFilter): string {
  return filter.presentation ?? "menu";
}

function useDisplayIntent(atom) {
  const [hasActive, clearActive] = ctx.use(atom);
  const intent = hasActive ? "primary" : "none";

  let rightIcon: "caret-down" | undefined = "caret-down";
  let onRemove: any = undefined;
  if (hasActive) {
    rightIcon = undefined;
    onRemove = (evt) => {
      clearActive();
      evt.stopPropagation();
    };
  }

  return { intent, rightIcon, onRemove, hasActive };
}

function useFilterMenuAction(entries: FilterEntry[]): TableAction | null {
  const rest = useDisplayIntent(hasActiveFiltersAtom);

  if (entries.length === 0) return null;

  const filterMenu = h(
    Menu,
    entries.map(({ filter, label }) => {
      // A `menu-inline` filter renders its form directly in the menu (no
      // submenu); the default `menu` presentation uses the submenu item.
      if (presentationOf(filter) === "menu-inline") {
        return h(MenuInlineFilterItem, { key: filter.id, filter, label });
      }
      return h(ColumnFilterMenuItem, { key: filter.id, filter, label });
    }),
  );

  const filterIndicator = h(
    Tag,
    {
      minimal: true,
      large: true,
      icon: "filter",
      ...rest,
    },
    "Filter",
  );

  return {
    id: "filter",
    name: "Filter",
    icon: "filter",
    description: "Add a filter to the data panel.",
    targets: ALL_CARDINALITIES,
    render: (ctx) =>
      h(
        MenuDropdown,
        {
          content: filterMenu,
          placement: "bottom-start",
        },
        [filterIndicator],
      ),
  };
}

function useSortAction(): TableAction | null {
  const columnSpec = useSelector((s) => s.columnSpec);

  const rest = useDisplayIntent(hasActiveSortsAtom);

  const sortableCols = useMemo(
    () => columnSpec.filter((c) => c.sortable),
    [columnSpec],
  );

  if (sortableCols.length == 0) {
    return null;
  }
  const sortMenu = h(
    Menu,
    sortableCols.map((col) =>
      h(ColumnSortMenu, { key: col.key, columnKey: col.key, text: col.name }),
    ),
  );

  return {
    id: "sort",
    name: "Sort",
    icon: "sort",
    description: "Add a sort to the data panel.",
    targets: ALL_CARDINALITIES,
    render: (ctx) =>
      h(MenuDropdown, { content: sortMenu }, [
        h(
          Tag,
          {
            minimal: true,
            large: true,
            icon: "sort",
            ...rest,
          },
          "Sort",
        ),
      ]),
  };
}

const hasActiveFiltersAtom = atom(
  (get) => get(storeAtom)?.activeFilters.size ?? 0 > 0,
  (get, set) => {
    set(storeAtom, (s) => ({ ...s, activeFilters: new Map([]) }));
  },
);
const hasActiveSortsAtom = atom(
  (get) => get(storeAtom)?.columnSorts.length ?? 0 > 0,
  (get, set) => {
    set(storeAtom, (s) => ({ ...s, columnSorts: [] }));
  },
);
