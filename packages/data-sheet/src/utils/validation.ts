import type { CellValidation, ColumnSpec } from "../provider/column-spec.ts";

/**
 * Validate a single cell against its column spec. Order: `required` (empty →
 * error), then `validate`, then the deprecated `isValid` boolean. Returns
 * `null` when valid.
 */
export function validateCell(
  col: ColumnSpec,
  value: any,
  row: any,
  rowIndex: number,
): CellValidation | null {
  const isEmpty = value == null || value === "";

  if (col.required && isEmpty) {
    return { severity: "error", message: `${col.name} is required` };
  }
  if (col.validate != null) {
    return col.validate(value, row, { rowIndex });
  }
  if (col.isValid != null && !col.isValid(value)) {
    return { severity: "error", message: `Invalid ${col.name}` };
  }
  return null;
}

/** A validation error located to a specific cell. */
export interface CellValidationError {
  rowIndex: number;
  columnKey: string;
  severity: "error";
  message?: string;
}

/**
 * Collect all cell **errors** (not warnings) across the loaded rows, using the
 * merged (base + edited) row values. Skips deleted rows. Used to block saving.
 * Iterates loaded rows × validating columns — for very large tables, consider
 * a memoized index; here it early-exits are the caller's (e.g. a length check).
 */
export function collectValidationErrors(s: {
  data?: any[];
  updatedData?: any[];
  columnSpec?: ColumnSpec[];
  rowStatus?: readonly string[];
}): CellValidationError[] {
  const data = s.data ?? [];
  const updatedData = s.updatedData ?? [];
  const columnSpec = s.columnSpec ?? [];
  const rowStatus = s.rowStatus ?? [];

  // Only columns that actually validate need scanning.
  const cols = columnSpec.filter(
    (c) => c.required || c.validate != null || c.isValid != null,
  );
  if (cols.length === 0) return [];

  const errors: CellValidationError[] = [];
  const n = Math.max(data.length, updatedData.length);
  for (let i = 0; i < n; i++) {
    if (rowStatus[i] === "deleted") continue;
    const row = { ...data[i], ...updatedData[i] };
    for (const col of cols) {
      const v = validateCell(col, row[col.key], row, i);
      if (v?.severity === "error") {
        errors.push({
          rowIndex: i,
          columnKey: col.key,
          severity: "error",
          message: v.message,
        });
      }
    }
  }
  return errors;
}
