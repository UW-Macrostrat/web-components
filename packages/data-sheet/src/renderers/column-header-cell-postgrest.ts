/**
 * Column header with server-side sort and filter controls.
 *
 * Uses Blueprint's ColumnHeaderCell `menuRenderer` prop to provide a
 * dropdown menu with sort direction toggles and a filter input.
 * The `nameRenderer` prop shows the column name plus visual indicators
 * for any active sort or filter.
 */
import { ColumnHeaderCell, ColumnHeaderCellProps } from "@blueprintjs/table";
import {
  Button,
  ButtonGroup,
  HTMLSelect,
  Icon,
  InputGroup,
  Menu,
} from "@blueprintjs/core";
import { useCallback, useRef, useState } from "react";
import h from "./column-header-cell-postgrest.module.sass";
import type { ColumnSpec, ColumnDataType } from "../utils/column-spec";
import type {
  ColumnSortEntry,
  ColumnFilterEntry,
  PostgRESTFilterOperator,
} from "../postgrest-table/data-loaders";
import { ColumnHeaderRendererProps } from "./column-header-cell";

/** Operators appropriate for string columns. */
const STRING_FILTER_OPERATORS: PostgRESTFilterOperator[] = [
  "eq",
  "neq",
  "ilike",
];

/** Operators appropriate for numeric / integer columns. */
const NUMERIC_FILTER_OPERATORS: PostgRESTFilterOperator[] = [
  "eq",
  "neq",
  "gt",
  "lt",
  "gte",
  "lte",
];

/** Operators appropriate for boolean columns. */
const BOOLEAN_FILTER_OPERATORS: PostgRESTFilterOperator[] = ["eq", "neq"];

/** Fallback operators when no type information is available. */
const DEFAULT_FILTER_OPERATORS: PostgRESTFilterOperator[] = [
  "eq",
  "neq",
  "ilike",
  "gt",
  "lt",
  "gte",
  "lte",
];

/** Map from data type to the appropriate set of filter operators. */
const OPERATORS_BY_TYPE: Record<string, PostgRESTFilterOperator[]> = {
  string: STRING_FILTER_OPERATORS,
  number: NUMERIC_FILTER_OPERATORS,
  integer: NUMERIC_FILTER_OPERATORS,
  boolean: BOOLEAN_FILTER_OPERATORS,
};

export const OPERATOR_LABELS: Record<PostgRESTFilterOperator, string> = {
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

/** The main column header cell renderer for PostgREST tables. */
export function renderPostgRESTColumnHeaderCell(
  props: ColumnHeaderRendererProps & { actions: ColumnHeaderActions },
): React.ReactElement<ColumnHeaderCellProps> | null {
  const { col, activeSort, activeFilter, actions } = props;

  const isSortable = col.sortable === true;
  const isFilterable =
    col.filterable === true || typeof col.filterable === "object";

  // If the column has no sort/filter capabilities, render a plain header
  if (!isSortable && !isFilterable) {
    return h(ColumnHeaderCell, { name: col.name });
  }

  return h(ColumnHeaderCell, {
    name: col.name,
    nameRenderer: (): any =>
      h(ColumnHeaderName, { col, activeFilter, activeSort }),
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
function ColumnHeaderName({ col, activeSort, activeFilter }) {
  const hasSortActive = activeSort != null;
  const hasFilterActive = activeFilter != null;
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

/** Resolve filter operators for a column, considering explicit config,
 * inferred data type, and fallback defaults. */
function getOperatorsForColumn(col: ColumnSpec): PostgRESTFilterOperator[] {
  // Explicit operators in filterable config take priority
  if (typeof col.filterable === "object" && col.filterable.operators?.length) {
    return col.filterable.operators as PostgRESTFilterOperator[];
  }
  // Otherwise, pick operators based on the inferred data type
  if (col.dataType != null) {
    return OPERATORS_BY_TYPE[col.dataType] ?? DEFAULT_FILTER_OPERATORS;
  }
  return DEFAULT_FILTER_OPERATORS;
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
  const operators = getOperatorsForColumn(col);

  const [filterOperator, setFilterOperator] = useState<PostgRESTFilterOperator>(
    activeFilter?.operator ?? operators[0],
  );
  const filterInputRef = useRef<HTMLInputElement>(null);

  const applyFilter = useCallback(() => {
    const val = filterInputRef.current?.value ?? "";
    if (val.trim() === "") {
      actions.onSetFilter(col.key, null, "");
    } else {
      actions.onSetFilter(col.key, filterOperator, val);
    }
  }, [col.key, filterOperator, actions]);

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
            defaultValue: activeFilter?.value ?? "",
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
              if (filterInputRef.current) {
                filterInputRef.current.value = "";
              }
            },
          },
          "Clear all",
        ),
      ]),
    ]),
  ]);
}
