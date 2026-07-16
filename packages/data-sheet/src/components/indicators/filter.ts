import type { ColumnSpec } from "../../utils";
import { useMemo, useState } from "react";
import { columnFilter, columnFilterId, ColumnFilterState, type TableFilter } from "../../actions";
import { useSelector, useStoreAPI } from "../../provider";
import { Button, HTMLSelect, InputGroup, MenuItem, PopoverNext, Tag } from "@blueprintjs/core";
import { FilterOperator, OPERATOR_LABELS } from "../../filters/operators.ts";
import h from "../toolbars/actions-toolbar.module.sass";

/** The filter for a column: its own rich `TableFilter` (from
 * `col.filters`) when present — so the header matches the top bar and the rich
 * filter is prioritized — else the built-in operator `columnFilter`. */
export function resolveColumnFilter(col: ColumnSpec): TableFilter {
  const rich = (col.filters as TableFilter[] | undefined)?.find(
    (f) => (f.columnKey ?? col.key) === col.key,
  );
  if (rich != null) return { ...rich, columnKey: rich.columnKey ?? col.key };
  return columnFilter(col);
}

export function ColumnFilterControl({ col }: { col: ColumnSpec }) {
  const storeAPI = useStoreAPI();
  // Same `TableFilter` the FilterBar and any provider consume, so the header,
  // the bar, and the query stay in sync (rich filter prioritized).
  const filter = useMemo(() => resolveColumnFilter(col), [col]);
  const state = useSelector((s) => s.activeFilters.get(filter.id)?.state);
  const isActive = state != null;
  const summary = isActive ? filter.describeState?.(state) : null;

  const setState = (next: any) => {
    const store = storeAPI.getState();
    // An empty operator-filter value clears; otherwise activate/update.
    if (next == null || next.value === "") {
      store.removeFilter(filter.id);
    } else {
      store.setFilter(filter.id, filter, next);
    }
  };

  const label = isActive ? String(summary ?? filter.name) : "Filter";

  return h(
    PopoverNext,
    {
      placement: "bottom-start",
      arrow: false,
      content: h(
        "div",
        { style: { padding: "6px", minWidth: "220px" } },
        filter.filterForm != null
          ? h(filter.filterForm, {
              state: state ?? filter.defaultState,
              setState,
            })
          : null,
      ),
    },
    h(
      Button,
      {
        small: true,
        minimal: true,
        icon: "filter",
        rightIcon: "caret-down",
        intent: isActive ? "primary" : "none",
      },
      label,
    ),
  );
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
    result.push(columnFilter(col));
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
  const storeAPI = useStoreAPI();
  const state = useSelector((s) => s.activeFilters.get(filter.id)?.state);
  const isActive = state != null;
  const summary = isActive ? filter.describeState?.(state) : null;

  const setState = (next: any) => {
    const store = storeAPI.getState();
    if (next == null || next.value === "") {
      store.removeFilter(filter.id);
    } else {
      store.setFilter(filter.id, filter, next);
    }
  };

  return h(
    MenuItem,
    {
      icon: filter.icon ?? "filter",
      text: label,
      label: summary != null ? String(summary) : undefined,
      intent: isActive ? "primary" : undefined,
      shouldDismissPopover: false,
    },
    filter.filterForm != null
      ? h(
          "div.filter-menu-form",
          { style: { padding: "6px", minWidth: "220px" } },
          h(filter.filterForm, {
            state: state ?? filter.defaultState,
            setState,
          }),
        )
      : null,
  );
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

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "6px" } },
    [
      // Compact header: title + operator on one row (with a clear ✕ when set),
      // value on the next — space-efficient and full-width for the value.
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "6px" } },
        [
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
        ],
      ),
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
    ],
  );
}
/** A single active filter displayed as a tag. Clicking opens a popover
 * for reconfiguring the filter; the remove button deactivates it. */
export function ActiveFilterTag<T>({
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
      className: "filter-tag",
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
