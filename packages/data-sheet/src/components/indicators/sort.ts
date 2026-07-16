import h from "@macrostrat/hyper";
import { Button, Menu, MenuItem, PopoverNext } from "@blueprintjs/core";
import { ColumnSort, ctx, storeAtom } from "../../provider";
import { useMemo } from "react";
import { atom } from "jotai";

function ColumnSortActions({ sort, setSort }) {
  return h([
    h(MenuItem, {
      key: "asc",
      text: "Ascending",
      icon: "sort-asc",
      active: sort?.ascending === true,
      onClick: () => setSort(true),
      shouldDismissPopover: false,
    }),
    h(MenuItem, {
      key: "desc",
      text: "Descending",
      icon: "sort-desc",
      active: sort?.ascending === false,
      onClick: () => setSort(false),
      shouldDismissPopover: false,
    }),
  ]);
}

function displayParamsForSort(sort: ColumnSort | undefined) {
  const icon =
    sort == null ? "sort" : sort.ascending ? "sort-asc" : "sort-desc";
  const label =
    sort == null ? "Sort" : sort.ascending ? "Ascending" : "Descending";
  return { icon, label };
}

export function ColumnSortControl({ columnKey }: { columnKey: string }) {
  const [sort, setSort] = useSortAtom(columnKey);
  const { icon, label } = displayParamsForSort(sort);

  return h(
    PopoverNext,
    {
      placement: "bottom-start",
      arrow: false,
      content: h(Menu, h(ColumnSortActions, { sort, setSort })),
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
}: {
  columnKey: string;
  text?: string;
}) {
  const [sort, setSort] = useSortAtom(columnKey);
  const { icon, label } = displayParamsForSort(sort);
  return h(
    MenuItem,
    { icon, text: label },
    h(ColumnSortActions, { sort, setSort }),
  );
}

function useSortAtom(columnKey) {
  const sortAtom = useMemo(
    () =>
      atom(
        (get) => {
          return get(storeAtom)?.columnSorts.find((x) => x.key === columnKey);
        },
        (get, set, ascending: boolean | null) => {
          const store = get(storeAtom);
          if (store == null) return;
          const currentVal = store.columnSorts.find(
            (x) => x.key === columnKey,
          )?.ascending;
          let nextVal = ascending;
          if (currentVal != null) {
            if (currentVal == nextVal) {
              // Unset
              nextVal = null;
            }
          }

          store.setColumnSort(columnKey, nextVal);
        },
      ),
    [columnKey],
  );
  return ctx.use(sortAtom);
}
