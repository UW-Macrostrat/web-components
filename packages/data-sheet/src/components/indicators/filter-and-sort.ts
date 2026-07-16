import type { ColumnSpec } from "../../utils";
import { ReactNode, useCallback, useMemo, useState } from "react";
import {
  buildMultiOperatorColumnFilter,
  columnFilterId,
  ColumnFilterState,
  type TableFilter,
} from "../../actions";
import { ColumnSort, ctx, storeAtom } from "../../provider";
import {
  Button,
  HTMLSelect,
  InputGroup,
  Menu,
  MenuItem,
  PopoverNext,
  Tag,
} from "@blueprintjs/core";
import { FilterOperator, OPERATOR_LABELS } from "../../filters/operators";
import classNames from "classnames";
import { atom } from "jotai";
import h from "./filter-and-sort.module.sass";

/** The filter for a column: its own rich `TableFilter` (from
 * `col.filters`) when present — so the header matches the top bar and the rich
 * filter is prioritized — else the built-in operator `columnFilter`. */
export function resolveColumnFilter(col: ColumnSpec): TableFilter {
  const rich = (col.filters as TableFilter[] | undefined)?.find(
    (f) => (f.columnKey ?? col.key) === col.key,
  );
  if (rich != null) return { ...rich, columnKey: rich.columnKey ?? col.key };
  return buildMultiOperatorColumnFilter(col);
}

/** Shows an active column filter in the top menu */
export function ColumnFilterControl({ col }: { col: ColumnSpec }) {
  // Same `TableFilter` the FilterBar and any provider consume, so the header,
  // the bar, and the query stay in sync (rich filter prioritized).
  const filter = useMemo(() => resolveColumnFilter(col), [col]);
  return h(FilterIndicator, {
    filter,
    large: true,
    minimal: true,
    showSubject: false,
  });
}

export function FilterIndicator({
  filter,
  large,
  minimal = false,
  showSubject = true,
}: {
  filter: TableFilter;
  state: any;
  large?: boolean;
  minimal?: boolean;
  showSubject: boolean;
}) {
  const props = useFilterProps(filter);

  const { valueText, filterForm, icon, intent, isActive, onRemove } = props;

  let rightIcon: string | undefined = "caret-down";
  if (isActive) {
    rightIcon = undefined;
  }

  const label = buildFilterTagLabel(filter, valueText, {
    minimal,
    showSubject,
    isActive,
  });

  return h(
    MenuDropdown,
    {
      content: filterForm,
    },
    h(
      Tag,
      {
        minimal: true,
        large,
        icon,
        rightIcon,
        intent,
        onRemove,
        className: classNames("filter-tag", { active: isActive }),
      },
      h("span.filter-label", label),
    ),
  );
}

function MenuDropdown({ children, content, isOpen, ...props }: any) {
  return h(
    PopoverNext,
    {
      content,
      placement: "bottom-start",
      enforceFocus: true,
      autoFocus: false,
    },
    children,
  );
}

function buildFilterTagLabel(
  filter: TableFilter,
  valueText: ReactNode | null,
  {
    minimal,
    showSubject,
    isActive,
  }: { minimal: boolean; showSubject: boolean; isActive: boolean },
): ReactNode {
  let name = filter.name;
  if (!showSubject) {
    name = "Filter";
  }

  let _showColumnKey = showSubject ?? !minimal;
  let columnKeyEl: ReactNode = null;
  const subj = filter.subject ?? filter.columnKey;
  if (_showColumnKey && subj != null) {
    columnKeyEl = h([h("span.subject", subj), h("span.sep", " ")]);
  }

  const showOperator = !minimal || !isActive;
  let operatorEl: ReactNode = null;
  if (showOperator) {
    operatorEl = h([h("span.operator", name), h("span.sep", ": ")]);
  }

  let filterWindow: ReactNode = null;
  if (valueText != null && valueText != "") {
    filterWindow = h("span.filter-value", valueText);
  }

  return h([columnKeyEl, operatorEl, filterWindow]);
}

/** Every filter applicable to a column: its rich `col.filters` (there may be
 * several) plus the built-in operator `columnFilter` when the column is
 * `filterable` and no rich filter already targets it. The menu lists all of
 * them; the toolbar's `render` collapses to `resolveColumnFilter` (a single
 * control). */
function applicableColumnFilters(col: ColumnSpec): TableFilter[] {
  const result: TableFilter[] = [];
  const rich = (col.filters as TableFilter[] | undefined) ?? [];
  for (const f of rich) {
    result.push({ ...f, columnKey: f.columnKey ?? col.key });
  }
  const hasOwnColumnFilter = result.some((r) => r.columnKey === col.key);
  if (
    (col.filterable === true || typeof col.filterable === "object") &&
    !hasOwnColumnFilter
  ) {
    result.push(buildMultiOperatorColumnFilter(col));
  }
  return result;
}

/** One filter, as a menu item whose submenu carries its edit form. Active
 * filters get a warning intent and show their `describeState` summary. The
 * displayed `label` may differ from `filter.name` (e.g. the built-in operator
 * filter reads "Filter" in a column's own menu, where the column is implicit). */
export function ColumnFilterMenuItem({
  filter,
  label,
}: {
  filter: TableFilter;
  label: string;
}) {
  const { filterForm, icon, intent, valueText } = useFilterProps(filter);
  return h(
    MenuItem,
    {
      icon,
      text: label,
      label: valueText,
      intent,
      shouldDismissPopover: false,
    },
    filterForm,
  );
}

function useFilterProps(filter: TableFilter) {
  const [state, setState] = useFilterAtom(filter);

  const onRemove = useCallback(
    (event) => {
      setState(null);
      event.stopPropagation();
    },
    [setState],
  );

  const isActive = state != null;
  let summary: ReactNode = null;
  let label: ReactNode = filter.name ?? "Filter";
  if (isActive) {
    summary = filter.describeState?.(state);
    label = summary ?? filter.name;
    if (summary == "") summary = null;
    if (summary != null) {
      label = h([filter.name, h("span.filter-window", [": ", summary])]);
    }
  }

  let filterForm: ReactNode = null;
  if (filter.filterForm != null) {
    filterForm = h(
      "div.filter-form-container",
      h(filter.filterForm, {
        state: state ?? filter.defaultState,
        setState,
      }),
    );
  }

  return {
    filterForm,
    label,
    icon: filter.icon ?? "filter",
    intent: isActive ? "primary" : "none",
    isActive,
    nameText: filter.name,
    valueText: summary,
    onRemove: isActive ? onRemove : undefined,
  };
}

/** Menu-native filter: one item per applicable filter, each opening its form
 * in a submenu. */
export function ColumnFilterMenu({ col }: { col: ColumnSpec }) {
  const filters = useMemo(() => applicableColumnFilters(col), [col]);
  const builtinId = columnFilterId(col.key);
  return h(
    filters.map((f) =>
      h(ColumnFilterMenuItem, {
        key: f.id,
        filter: f,
        // The generic operator filter is just "Filter" in its own column's
        // menu; rich (user-provided) filters keep their descriptive names.
        label: f.id === builtinId ? "Filter" : f.name,
      }),
    ),
  );
}

export function ColumnFilterForm({
  operators,
  state,
  setState,
}: {
  operators: FilterOperator[];
  state: ColumnFilterState;
  setState: (s: ColumnFilterState) => void;
}) {
  // Operator and value are held locally, seeded once from the incoming state.
  // The operator must be local: committing it with an empty value clears the
  // filter (so the store round-trips back to the default state), which would
  // otherwise snap the dropdown back to the default — the operator wouldn't
  // "stick" until a value was typed. The value commits (triggering a server
  // re-fetch) on blur / Enter, not on every keystroke.
  const [op, setOp] = useState<FilterOperator>(state?.operator ?? operators[0]);
  const [val, setVal] = useState<string>(state?.value ?? "");

  const commit = (nextOp: FilterOperator, nextVal: string) =>
    setState({ operator: nextOp, value: nextVal });

  const clear = () => {
    setVal("");
    commit(op, "");
  };

  return h("div.column-filter-form", [
    // Compact header: title + operator on one row (with a clear ✕ when set),
    // value on the next — space-efficient and full-width for the value.
    h("div", { style: { display: "flex", alignItems: "center", gap: "6px" } }, [
      h("span", { style: { fontWeight: 600 } }, "Filter"),
      h(HTMLSelect, {
        small: true,
        value: op,
        options: operators.map((o) => ({
          value: o,
          label: OPERATOR_LABELS[o] ?? o,
        })),
        onChange: (e) => {
          const nextOp = e.currentTarget.value as FilterOperator;
          setOp(nextOp);
          commit(nextOp, val);
        },
      }),
      h("div", { style: { flex: 1 } }),
      h.if(val !== "")(Button, {
        small: true,
        minimal: true,
        icon: "cross",
        "aria-label": "Clear filter",
        onClick: clear,
      }),
    ]),
    h(InputGroup, {
      small: true,
      fill: true,
      value: val,
      placeholder: "value",
      autoFocus: true,
      onChange: (e) => setVal(e.target.value),
      onBlur: () => commit(op, val),
      onKeyDown: (e) => {
        if (e.key === "Enter") commit(op, val);
      },
    }),
  ]);
}

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
    sort == null ? null : sort.ascending ? "Ascending" : "Descending";
  return { icon, label };
}

export function ColumnSortIndicator({
  columnKey,
  showColumnKey,
  small,
  large,
}: {
  showColumnKey: string;
  columnKey: string;
  small?: boolean;
  large?: boolean;
}) {
  const [sort, setSort] = useSortAtom(columnKey);
  const { icon, label } = displayParamsForSort(sort);

  const columnLabel = showColumnKey ? `${columnKey}: ` : "";
  let onRemove: any = undefined;
  let rightIcon: string | undefined = "caret-down";
  let intent: "none" | "primary" = "none";
  if (sort != null) {
    rightIcon = undefined;
    onRemove = () => setSort(null);
    intent = "primary";
  }

  return h(
    MenuDropdown,
    {
      content: h(Menu, h(ColumnSortActions, { sort, setSort })),
    },
    h(
      Tag,
      {
        small,
        large,
        minimal: true,
        icon,
        rightIcon,
        intent,
        onRemove,
      },
      h([columnLabel, label]),
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
    { icon, text: label ?? columnKey },
    h(ColumnSortActions, { sort, setSort }),
  );
}

const setFilterAtom = atom(null, (get, set, filter: TableFilter, next: any) => {
  const store = get(storeAtom);
  if (store == null) return;
  if (next == null || next.value === "") {
    store.removeFilter(filter.id);
  } else {
    store.setFilter(filter.id, filter, next);
  }
});

function useFilterAtom(filter: TableFilter) {
  const filterStateAtom = useMemo(
    () =>
      atom(
        (get) => {
          const store = get(storeAtom);
          return store?.activeFilters.get(filter.id)?.state;
        },
        (get, set, next: any) => {
          set(setFilterAtom, filter, next);
        },
      ),
    [filter.id],
  );
  return ctx.use(filterStateAtom);
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
