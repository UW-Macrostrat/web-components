import {
  ALL_CARDINALITIES,
  isColumnFilterable,
  TableAction,
} from "../../actions";
import { useSelector } from "../../provider";
import { useMemo } from "react";
import h from "../../data-panel.module.sass";
import { Button, Menu, PopoverNext } from "@blueprintjs/core";
import {
  ColumnFilterMenuItem,
  ColumnSortMenu,
  resolveColumnFilter,
} from "./filter-and-sort.ts";

/**
 * Stand-in for the column-header dropdown the card list lacks: "Filter" and
 * "Sort" menus listing the column-declared `filterable` / `sortable` fields.
 * Each field reuses the *exact* data-sheet controls — `ColumnSortMenu`
 * (Ascending/Descending submenu) and `ColumnFilterMenuItem` (the operator form
 * in a submenu) — so sort/filter behave identically to the sheet and flow
 * through the same store + provider seam (the server applies them).
 */
export function useDataPanelControls(): TableAction[] {
  const columnSpec = useSelector((s) => s.columnSpec);
  const filterableCols = useMemo(
    () => columnSpec.filter((c) => isColumnFilterable(c)),
    [columnSpec],
  );
  const sortableCols = useMemo(
    () => columnSpec.filter((c) => c.sortable),
    [columnSpec],
  );

  const actions: TableAction[] = [];
  if (filterableCols.length > 0) {
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

    const filterAction: TableAction = {
      id: "filter",
      name: "Filter",
      icon: "filter",
      description: "Add a filter to the data panel.",
      targets: ALL_CARDINALITIES,
      render: (ctx) =>
        h(PopoverNext, { content: filterMenu, placement: "bottom-start" }, [
          h(Button, { minimal: true, small: true, icon: "filter" }, "Filter"),
        ]),
    };
    actions.push(filterAction);
  }

  if (sortableCols.length > 0) {
    const sortMenu = h(
      Menu,
      sortableCols.map((col) =>
        h(ColumnSortMenu, { key: col.key, columnKey: col.key, text: col.name }),
      ),
    );

    const sortAction: TableAction = {
      id: "sort",
      name: "Sort",
      icon: "sort",
      description: "Add a sort to the data panel.",
      targets: ALL_CARDINALITIES,
      render: (ctx) =>
        h(PopoverNext, { content: sortMenu, placement: "bottom-start" }, [
          h(Button, { minimal: true, small: true, icon: "sort" }, "Sort"),
        ]),
    };
    actions.push(sortAction);
  }

  return actions;
}
