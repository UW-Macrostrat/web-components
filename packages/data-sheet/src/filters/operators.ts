/**
 * The canonical column-filter operator vocabulary, shared by the client-side
 * predicate (in-memory tables) and the server-side descriptor (a provider
 * translates it to a query). Promoted to core from the PostgREST column header,
 * so there is one operator model, not two.
 */
import type { ColumnSpec } from "../utils/column-spec";

/** Column-filter operators. A superset that covers both in-memory comparison
 * and common backend query operators (PostgREST maps onto these names).
 * `cs`/`ov` are the array-column operators (contains / overlaps). */
export type FilterOperator =
  | "eq"
  | "neq"
  | "like"
  | "ilike"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "is"
  | "cs"
  | "ov";

/** Human-readable operator labels for menus and active-filter tags. */
export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: "=",
  neq: "≠",
  like: "like",
  ilike: "contains",
  gt: ">",
  lt: "<",
  gte: "≥",
  lte: "≤",
  is: "is",
  cs: "has",
  ov: "has any of",
};

// "contains" (`ilike`) leads for text, so it's the default operator — the most
// common intent when filtering a string column.
const STRING_OPERATORS: FilterOperator[] = ["ilike", "eq", "neq"];
const NUMERIC_OPERATORS: FilterOperator[] = [
  "eq",
  "neq",
  "gt",
  "lt",
  "gte",
  "lte",
];
const BOOLEAN_OPERATORS: FilterOperator[] = ["eq", "neq"];
// Array columns (e.g. a `text[]` of tags): "has" one value, or "has any of" a
// comma-separated set. `cs` leads — filtering to a single value is the norm.
const ARRAY_OPERATORS: FilterOperator[] = ["cs", "ov"];

/** Fallback when the column has no type information. Leads with "contains". */
export const DEFAULT_FILTER_OPERATORS: FilterOperator[] = [
  "ilike",
  "eq",
  "neq",
  "gt",
  "lt",
  "gte",
  "lte",
];

const OPERATORS_BY_TYPE: Record<string, FilterOperator[]> = {
  string: STRING_OPERATORS,
  number: NUMERIC_OPERATORS,
  integer: NUMERIC_OPERATORS,
  boolean: BOOLEAN_OPERATORS,
  array: ARRAY_OPERATORS,
};

/** Resolve the operators offered for a column: explicit `filterable.operators`
 * first, else inferred from `dataType`, else the defaults. */
export function getOperatorsForColumn(col: ColumnSpec): FilterOperator[] {
  if (typeof col.filterable === "object" && col.filterable.operators?.length) {
    return col.filterable.operators as FilterOperator[];
  }
  if (col.dataType != null) {
    return OPERATORS_BY_TYPE[col.dataType] ?? DEFAULT_FILTER_OPERATORS;
  }
  return DEFAULT_FILTER_OPERATORS;
}

function looseEq(a: any, b: any): boolean {
  if (a == null) return b == null || b === "";
  // Compare numerically when both look numeric, else as strings.
  const an = Number(a);
  const bn = Number(b);
  if (!Number.isNaN(an) && !Number.isNaN(bn) && String(a).trim() !== "") {
    return an === bn;
  }
  return String(a).toLowerCase() === String(b).toLowerCase();
}

/**
 * The client-side predicate for a `{ operator, value }` column filter — the
 * in-memory equivalent of what a backend applies server-side. An empty filter
 * value is treated as "no constraint" (matches everything).
 */
export function testFilterOperator(
  cellValue: any,
  operator: FilterOperator,
  filterValue: any,
): boolean {
  if (filterValue === "" || filterValue == null) return true;
  switch (operator) {
    case "eq":
      return looseEq(cellValue, filterValue);
    case "neq":
      return !looseEq(cellValue, filterValue);
    case "gt":
      return Number(cellValue) > Number(filterValue);
    case "lt":
      return Number(cellValue) < Number(filterValue);
    case "gte":
      return Number(cellValue) >= Number(filterValue);
    case "lte":
      return Number(cellValue) <= Number(filterValue);
    case "like":
      return String(cellValue ?? "").includes(String(filterValue));
    case "ilike":
      return String(cellValue ?? "")
        .toLowerCase()
        .includes(String(filterValue).toLowerCase());
    case "is": {
      const v = String(filterValue).toLowerCase();
      if (v === "null") return cellValue == null;
      if (v === "true") return cellValue === true;
      if (v === "false") return cellValue === false;
      return looseEq(cellValue, filterValue);
    }
    case "cs": {
      // Array column contains the value (all of them, if comma-separated).
      if (!Array.isArray(cellValue)) return false;
      const cell = cellValue.map((v) => String(v));
      return splitList(filterValue).every((v) => cell.includes(v));
    }
    case "ov": {
      // Array column overlaps the value set (has any of them).
      if (!Array.isArray(cellValue)) return false;
      const cell = cellValue.map((v) => String(v));
      return splitList(filterValue).some((v) => cell.includes(v));
    }
    default:
      return true;
  }
}

/** Split a filter value into a list of trimmed, non-empty tokens (comma is the
 * set separator for `cs`/`ov`); a single value yields a one-element list. */
function splitList(value: any): string[] {
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
}
