/**
 * Column header with server-side sort and filter controls.
 *
 * Uses Blueprint's ColumnHeaderCell `menuRenderer` prop to provide a
 * dropdown menu with sort direction toggles and a filter input.
 * The `nameRenderer` prop shows the column name plus visual indicators
 * for any active sort or filter.
 */
import hyper from "@macrostrat/hyper";
import { ColumnHeaderCell } from "@blueprintjs/table";
import {
  Button,
  ButtonGroup,
  HTMLSelect,
  Icon,
  InputGroup,
  Menu,
} from "@blueprintjs/core";
import { useCallback, useState } from "react";
import styles from "./column-header.module.sass";
import type { ColumnSpec } from "../utils/column-spec";
import type {
  ColumnSortEntry,
  ColumnFilterEntry,
  PostgRESTFilterOperator,
} from "./data-loaders";

const h = hyper.styled(styles);

const DEFAULT_FILTER_OPERATORS: PostgRESTFilterOperator[] = [
  "eq",
  "neq",
  "ilike",
  "gt",
  "lt",
  "gte",
  "lte",
];

const OPERATOR_LABELS: Record<PostgRESTFilterOperator, string> = {
  eq: "=",
  neq: "≠",
  like: "like",
  ilike: "contains",
  gt: ">",
  lt: "<",
  gte: "≥",
  lte: "≤",
  is: "is",
};

export interface ColumnHeaderActions {
  onSetSort: (key: string, ascending: boolean | null) => void;
  onSetFilter: (
    key: string,
    operator: PostgRESTFilterOperator | null,
    value: string,
  ) => void;
  onClearColumn: (key: string) => void;
}

interface ColumnHeaderPopoverProps {
  col: ColumnSpec;
  columnSorts: ColumnSortEntry[];
  columnFilters: ColumnFilterEntry[];
  actions: ColumnHeaderActions;
}

/** The main column header cell renderer for PostgREST tables. */
export function PostgRESTColumnHeaderCell(props: ColumnHeaderPopoverProps) {
  const { col, columnSorts, columnFilters, actions } = props;

  const isSortable = col.sortable === true;
  const isFilterable =
    col.filterable === true || typeof col.filterable === "object";

  // If the column has no sort/filter capabilities, render a plain header
  if (!isSortable && !isFilterable) {
    return h(ColumnHeaderCell, { name: col.name });
  }

  const activeSort = columnSorts.find((s) => s.key === col.key);
  const activeFilter = columnFilters.find((f) => f.key === col.key);

  const hasSortActive = activeSort != null;
  const hasFilterActive =
    activeFilter != null &&
    activeFilter.value !== "" &&
    activeFilter.value != null;

  return h(ColumnHeaderCell, {
    name: col.name,
    nameRenderer: () =>
      h(ColumnHeaderName, { col, hasSortActive, hasFilterActive, activeSort }),
    menuRenderer: () =>
      h(ColumnActionsMenu, {
        col,
        isSortable,
        isFilterable,
        activeSort,
        activeFilter,
        actions,
      }),
  });
}

/** Column name with active sort/filter indicator icons. */
function ColumnHeaderName({ col, hasSortActive, hasFilterActive, activeSort }) {
  return h("div.column-header-cell", [
    h("span.column-name", col.name),
    h.if(hasSortActive || hasFilterActive)("span.column-indicators", [
      h.if(hasSortActive)(
        "span.sort-indicator",
        h(Icon, {
          icon: activeSort?.ascending ? "sort-asc" : "sort-desc",
          size: 12,
        }),
      ),
      h.if(hasFilterActive)(
        "span.filter-indicator",
        h(Icon, { icon: "filter", size: 12 }),
      ),
    ]),
  ]);
}

/** Menu content rendered inside ColumnHeaderCell's built-in dropdown. */
function ColumnActionsMenu({
  col,
  isSortable,
  isFilterable,
  activeSort,
  activeFilter,
  actions,
}) {
  const filterableConfig =
    typeof col.filterable === "object" ? col.filterable : {};
  const operators: PostgRESTFilterOperator[] =
    filterableConfig.operators ?? DEFAULT_FILTER_OPERATORS;

  const [filterOperator, setFilterOperator] = useState<PostgRESTFilterOperator>(
    activeFilter?.operator ?? operators[0],
  );
  const [filterValue, setFilterValue] = useState(activeFilter?.value ?? "");

  const applyFilter = useCallback(() => {
    if (filterValue.trim() === "") {
      actions.onSetFilter(col.key, null, "");
    } else {
      actions.onSetFilter(col.key, filterOperator, filterValue);
    }
  }, [col.key, filterOperator, filterValue, actions]);

  const hasAnyActive =
    activeSort != null ||
    (activeFilter != null &&
      activeFilter.value !== "" &&
      activeFilter.value != null);

  return h(Menu, { className: "column-actions-menu" }, [
    h("div.column-actions-popover", [
      h.if(isSortable)("div.popover-section", [
        h("div.popover-section-title", "Sort"),
        h("div.sort-buttons", [
          h(ButtonGroup, { minimal: true }, [
            h(
              Button,
              {
                icon: "sort-asc",
                active: activeSort?.ascending === true,
                intent: activeSort?.ascending === true ? "primary" : "none",
                onClick() {
                  if (activeSort?.ascending === true) {
                    actions.onSetSort(col.key, null);
                  } else {
                    actions.onSetSort(col.key, true);
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
                  if (activeSort?.ascending === false) {
                    actions.onSetSort(col.key, null);
                  } else {
                    actions.onSetSort(col.key, false);
                  }
                },
              },
              "Z→A",
            ),
          ]),
        ]),
      ]),
      h.if(isFilterable)("div.popover-section", [
        h("div.popover-section-title", "Filter"),
        h("div.filter-row", [
          h(HTMLSelect, {
            className: "filter-operator-select",
            value: filterOperator,
            options: operators.map((op) => ({
              value: op,
              label: OPERATOR_LABELS[op] ?? op,
            })),
            onChange(e) {
              setFilterOperator(e.target.value as PostgRESTFilterOperator);
            },
          }),
          h(InputGroup, {
            className: "filter-value-input",
            small: true,
            placeholder: "Value…",
            value: filterValue,
            onValueChange(val) {
              setFilterValue(val);
            },
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
        ]),
      ]),
      h.if(hasAnyActive)("div.clear-section", [
        h(
          Button,
          {
            small: true,
            minimal: true,
            intent: "danger",
            icon: "cross",
            onClick() {
              actions.onClearColumn(col.key);
              setFilterValue("");
            },
          },
          "Clear all",
        ),
      ]),
    ]),
  ]);
}
