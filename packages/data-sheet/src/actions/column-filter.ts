/**
 * The built-in, operator-first column filter — the core generalization of the
 * PostgREST column header's per-type operator model. `columnFilter(col)` yields
 * a standard `TableFilter` whose state is `{ operator, value }`, so it flows
 * through the same store, `FilterBar`, and provider seam as any other
 * filter. One definition serves both targets: `predicate` filters in-memory
 * tables client-side, while `columnKey` + `state` are what a server provider
 * translates to a query. Operators are inferred from the column's `dataType`
 * (overridable via `filterable: { operators }`).
 */
import hyper from "@macrostrat/hyper";
import type { ColumnSpec } from "../provider/column-spec.ts";
import type { ColumnFilterOptions, TableFilter } from "./types";
import {
  FilterOperator,
  getOperatorsForColumn,
  OPERATOR_LABELS,
  testFilterOperator,
} from "../filters/operators";
import { ColumnFilterForm } from "../components";

const h = hyper;

export interface ColumnFilterState {
  operator: FilterOperator;
  value: string;
}

/** Stable filter id for a column's built-in operator filter. */
export function columnFilterId(key: string): string {
  return `column-filter:${key}`;
}

/** Built-in column filter for a column. */
export function buildMultiOperatorColumnFilter(
  col: ColumnSpec,
): TableFilter<any, ColumnFilterState> {
  const operators = getOperatorsForColumn(col);
  return enhanceColumnFilter(col, {
    id: "default",
    icon: "filter",
    defaultState: { operator: operators[0], value: "" },
    describeState: (s) => {
      const val = s?.value;
      if (val == null || val === "") return null;
      const op = OPERATOR_LABELS[s.operator] ?? s.operator;
      return `${op} ${val}`;
    },
    predicate: (row, s) => {
      return testFilterOperator(row?.[col.key], s.operator, s.value);
    },
    filterForm: ({ state, setState }) =>
      h(ColumnFilterForm, { operators, state, setState }),
  });
}

/** Enhance column filter into a full TableFilter object. */
export function enhanceColumnFilter(
  col: ColumnSpec,
  f: ColumnFilterOptions,
): TableFilter<any, ColumnFilterState> {
  return {
    ...f,
    id: `column-filter:${col.key}:${f.id}`,
    name: f.name ?? col.name,
    subject: col.name,
    columnKey: col.key,
  };
}
