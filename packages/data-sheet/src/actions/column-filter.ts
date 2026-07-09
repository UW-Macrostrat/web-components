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
import { ControlGroup, FormGroup, HTMLSelect, InputGroup } from "@blueprintjs/core";
import type { ColumnSpec } from "../utils/column-spec";
import type { TableFilter } from "./types";
import {
  FilterOperator,
  getOperatorsForColumn,
  OPERATOR_LABELS,
  testFilterOperator,
} from "../filters/operators";

const h = hyper;

export interface ColumnFilterState {
  operator: FilterOperator;
  value: string;
}

/** Stable filter id for a column's built-in operator filter. */
export function columnFilterId(key: string): string {
  return `column-filter:${key}`;
}

/** Generate the built-in operator filter for a `filterable` column. */
export function columnFilter(
  col: ColumnSpec,
): TableFilter<any, ColumnFilterState> {
  const operators = getOperatorsForColumn(col);
  return {
    id: columnFilterId(col.key),
    name: col.name,
    icon: "filter",
    columnKey: col.key,
    defaultState: { operator: operators[0], value: "" },
    describeState: (s) =>
      s?.value
        ? `${OPERATOR_LABELS[s.operator] ?? s.operator} ${s.value}`
        : null,
    predicate: (row, s) =>
      testFilterOperator(row?.[col.key], s.operator, s.value),
    filterForm: ({ state, setState }) =>
      h(ColumnFilterForm, { operators, state, setState }),
  };
}

function ColumnFilterForm({
  operators,
  state,
  setState,
}: {
  operators: FilterOperator[];
  state: ColumnFilterState;
  setState: (s: ColumnFilterState) => void;
}) {
  return h(
    FormGroup,
    { label: "Filter" },
    h(ControlGroup, { fill: true }, [
      h(HTMLSelect, {
        key: "op",
        value: state.operator,
        options: operators.map((op) => ({
          value: op,
          label: OPERATOR_LABELS[op] ?? op,
        })),
        onChange: (e) =>
          setState({ ...state, operator: e.currentTarget.value as FilterOperator }),
      }),
      h(InputGroup, {
        key: "val",
        value: state.value,
        placeholder: "value",
        autoFocus: true,
        onChange: (e) => setState({ ...state, value: e.target.value }),
      }),
    ]),
  );
}
