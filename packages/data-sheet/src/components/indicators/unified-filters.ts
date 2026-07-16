import {
  ALL_CARDINALITIES,
  isColumnFilterable,
  TableAction,
  type TableFilter,
} from "../../actions";
import { ctx, storeAtom, useSelector } from "../../provider";
import { useMemo } from "react";
import h from "../../data-panel.module.sass";
import { Button, Menu, PopoverNext, Tag } from "@blueprintjs/core";
import {
  ColumnFilterMenuItem,
  ColumnSortMenu,
  MenuDropdown,
  resolveColumnFilter,
} from "./filter-and-sort.ts";
import { atom } from "jotai";

/**
 * Stand-in for the column-header dropdown the card list lacks: "Filter" and
 * "Sort" menus listing the column-declared `filterable` / `sortable` fields.
 * Each field reuses the *exact* data-sheet controls — `ColumnSortMenu`
 * (Ascending/Descending submenu) and `ColumnFilterMenuItem` (the operator form
 * in a submenu) — so sort/filter behave identically to the sheet and flow
 * through the same store + provider seam (the server applies them).
 */
export function useDataPanelControls(): TableAction[] {
  const filterAction = useUnifiedFilterAction();

  const actions: TableAction[] = [];
  if (filterAction != null) {
    actions.push(filterAction);
  }
  const sortAction = useSortAction();
  if (sortAction != null) {
    actions.push(sortAction);
  }
  return actions;
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

function useUnifiedFilterAction(): TableAction | null {
  const columnSpec = useSelector((s) => s.columnSpec);
  const filterableCols = useMemo(
    () => columnSpec.filter((c) => isColumnFilterable(c)),
    [columnSpec],
  );

  const rest = useDisplayIntent(hasActiveFiltersAtom);

  if (filterableCols.length === 0) return null;

  const filterMenu = h(
    Menu,
    filterableCols.map((col) =>
      h(ColumnFilterMenuItem, {
        key: col.key,
        filter: resolveColumnFilter(col),
        label: col.name,
      }),
    ),
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
