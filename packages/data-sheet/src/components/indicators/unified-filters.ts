import {
  ALL_CARDINALITIES,
  isColumnFilterable,
  TableAction,
  TableFilter,
} from "../../actions";
import {
  ctx,
  enableSelectionAtom,
  interactionOptionsAtom,
  storeAtom,
  useSelector,
} from "../../provider";
import { type ReactNode, useMemo } from "react";
import h from "../../data-panel.module.sass";
import { Button, Menu, MenuDivider, Tag } from "@blueprintjs/core";
import {
  ColumnFilterMenuItem,
  ColumnSortMenu,
  InlineFilterControl,
  MenuDropdown,
  MenuFormItem,
  MenuInlineFilterItem,
  resolveColumnFilter,
} from "./filter-and-sort.ts";
import { toggleModalSelectionAtom } from "./selection.ts";
import { atom } from "jotai";

/** How the built-in view controls (inline filters, Filter menu, Sort menu) are
 * placed in the toolbar:
 *  - `"inline"` (default): each control sits in the toolbar.
 *  - `"popover"`: all of them collapse behind a single button — for a narrow or
 *    deliberately chrome-light toolbar.
 * In both cases the controls, state, and provider seam are identical. */
export type ViewControlsPresentation = "inline" | "popover";

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
  presentation: ViewControlsPresentation = "inline",
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
  const collapsedAction = useCollapsedControlsAction(entries);
  const exitSelectionAction = useExitSelectionAction();

  // While a modal view is *selecting*, the toolbar belongs to the selection and
  // its set-actions. Changing the view would also invalidate the selection
  // (rows are addressed by index — see `dropRowSelection`), so rather than
  // competing for space, the view controls collapse to a single affordance that
  // **leaves select mode** and hands the toolbar back.
  if (exitSelectionAction != null) return [exitSelectionAction];

  // One button holding every control, for a toolbar with no room for them (or a
  // deliberately chrome-light layout).
  if (presentation === "popover" && collapsedAction != null) {
    return [collapsedAction];
  }

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

/**
 * The whole view-control set behind one button: inline filters as titled
 * sections, then the filters, then the sorts. Same controls, same store seam —
 * only placement changes (the `presentation` idea from `TableFilter`, applied to
 * the toolbar as a whole).
 */
function useCollapsedControlsAction(
  entries: FilterEntry[],
): TableAction | null {
  const columnSpec = useSelector((s) => s.columnSpec);
  const hasActiveFilters = ctx.useValue(hasActiveFiltersAtom);
  const hasActiveSorts = ctx.useValue(hasActiveSortsAtom);

  const sortableCols = useMemo(
    () => columnSpec.filter((c) => c.sortable),
    [columnSpec],
  );

  if (entries.length === 0 && sortableCols.length === 0) return null;

  const inlineEntries = entries.filter(
    (e) => presentationOf(e.filter) === "inline",
  );
  const menuEntries = entries.filter(
    (e) => presentationOf(e.filter) !== "inline",
  );

  const items: ReactNode[] = [];
  for (const { filter, label } of inlineEntries) {
    items.push(
      h(MenuFormItem, { key: filter.id, title: label }, [
        h(InlineFilterControl, { filter }),
      ]),
    );
  }
  if (menuEntries.length > 0) {
    items.push(h(MenuDivider, { key: "filter-divider", title: "Filter" }));
    for (const { filter, label } of menuEntries) {
      if (presentationOf(filter) === "menu-inline") {
        items.push(h(MenuInlineFilterItem, { key: filter.id, filter, label }));
      } else {
        items.push(h(ColumnFilterMenuItem, { key: filter.id, filter, label }));
      }
    }
  }
  if (sortableCols.length > 0) {
    items.push(h(MenuDivider, { key: "sort-divider", title: "Sort" }));
    for (const col of sortableCols) {
      items.push(
        h(ColumnSortMenu, { key: col.key, columnKey: col.key, text: col.name }),
      );
    }
  }

  let intent: "primary" | "none" = "none";
  if (hasActiveFilters || hasActiveSorts) intent = "primary";

  return {
    id: "view-controls",
    name: "View",
    icon: "filter-list",
    description: "Search, filter and sort.",
    targets: ALL_CARDINALITIES,
    requiresEditable: false,
    render: () =>
      h(
        MenuDropdown,
        { content: h(Menu, { className: "collapsed-controls" }, items) },
        [
          h(Button, {
            minimal: true,
            small: true,
            icon: "filter-list",
            intent,
            title: "Search, filter and sort",
          }),
        ],
      ),
  };
}

/** While selecting on a modal view: one control that leaves select mode (and so
 * restores the view controls). Labelled for where it takes you, not what it
 * does to the selection. */
function useExitSelectionAction(): TableAction | null {
  const { enableModalSelection } = ctx.useValue(interactionOptionsAtom);
  const selecting = ctx.useValue(enableSelectionAtom);
  const toggleSelectMode = ctx.useSet(toggleModalSelectionAtom);

  if (!enableModalSelection || !selecting) return null;

  return {
    id: "exit-selection",
    name: "Filter",
    icon: "filter",
    description: "Leave select mode to filter and sort.",
    targets: ALL_CARDINALITIES,
    requiresEditable: false,
    render: () =>
      h(
        Tag,
        {
          minimal: true,
          large: true,
          interactive: true,
          icon: "filter",
          title: "Filter and sort (leaves select mode)",
          onClick: () => toggleSelectMode(),
        },
        "Filter",
      ),
  };
}

function presentationOf(filter: TableFilter): string {
  return filter.presentation ?? "menu";
}

/** Active-state + clear for a subset of filters, keyed by id. */
function useFilterSubsetState(entries: FilterEntry[]): [boolean, () => void] {
  const ids = entries.map((e) => e.filter.id);
  const key = ids.join("\u0000");
  const subsetAtom = useMemo(
    () =>
      atom(
        (get) => {
          const active = get(storeAtom)?.activeFilters;
          if (active == null) return false;
          return ids.some((id) => active.has(id));
        },
        (get) => {
          const store = get(storeAtom);
          if (store == null) return;
          for (const id of ids) store.removeFilter(id);
        },
      ),
    [key],
  );
  const [hasActive, clear] = ctx.use(subsetAtom);
  return [hasActive, clear as () => void];
}

function useDisplayIntent([hasActive, clearActive]: [boolean, () => void]) {
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
  // Scoped to the filters this menu actually holds. An `"inline"` filter has
  // its own always-visible control, so it must not light up the Filter tag —
  // nor be wiped by its clear button, which reads as "clear the filters in
  // here".
  const rest = useDisplayIntent(useFilterSubsetState(entries));

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

  const rest = useDisplayIntent(ctx.use(hasActiveSortsAtom));

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

// Both of these clear through the store's *actions* rather than writing the
// state directly: the actions are what also drop a now-meaningless row
// selection (see `dropRowSelection`).
const hasActiveFiltersAtom = atom(
  (get) => (get(storeAtom)?.activeFilters?.size ?? 0) > 0,
  (get) => {
    get(storeAtom)?.clearFilters?.();
  },
);
const hasActiveSortsAtom = atom(
  (get) => (get(storeAtom)?.columnSorts?.length ?? 0) > 0,
  (get) => {
    get(storeAtom)?.clearColumnSorts?.();
  },
);
