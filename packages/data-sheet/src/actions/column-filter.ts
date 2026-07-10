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
import { useState } from "react";
import { Button, HTMLSelect, InputGroup } from "@blueprintjs/core";
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
  // Operator and value are held locally, seeded once from the incoming state.
  // The operator must be local: committing it with an empty value clears the
  // filter (so the store round-trips back to the default state), which would
  // otherwise snap the dropdown back to the default — the operator wouldn't
  // "stick" until a value was typed. The value commits (triggering a server
  // re-fetch) on blur / Enter, not on every keystroke.
  const [op, setOp] = useState<FilterOperator>(
    state?.operator ?? operators[0],
  );
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
