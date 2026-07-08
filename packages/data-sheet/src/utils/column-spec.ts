import React from "react";

const defaultRenderers = {
  string: (d) => d,
  number: (d) => d?.toFixed(2),
  boolean: (d) => (d ? "T" : "F"),
  object: (d) => JSON.stringify(d),
  integer: (d) => d?.toFixed(0),
  array: (d) => d?.join(", "),
};

interface ColumnSpecGenerateOptions {
  calculateWidths?: boolean;
  defaultWidth?: number;
  getWidthForValue?: (value: any) => number;
}

const defaultWidthForValue = (val) => String(val).length * 8;

/** Inferred data type of a column, used to select appropriate
 * sort/filter operators. */
export type ColumnDataType =
  | "text"
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array";

/**
 * Context handed to per-cell renderers (`valueRenderer`, and — as the
 * `cellContext` prop — a custom `cellComponent`). It lets a renderer draw
 * based on the row/column position and the cell's edit status, and, combined
 * with the editing API, write edits back for a specific cell.
 *
 * `rowIndex` is the underlying **data-row index** (the value edit methods
 * expect), so it stays stable when a sort or filter reorders the view.
 */
export interface CellRenderContext<T = any> {
  /** The cell's current value (the edited value if present, else the base). */
  value: any;
  /** Underlying data-row index — stable under sort/filter. */
  rowIndex: number;
  /** Column index within the active column spec. */
  colIndex: number;
  /** The full column spec for this cell's column. */
  column: ColumnSpec;
  /** The full row object backing this cell (may be undefined while loading). */
  row: T | undefined;
  /** Whether this cell has an uncommitted edit. */
  isEdited: boolean;
  /** Whether this cell's row is marked for deletion. */
  isDeleted: boolean;
}

/**
 * The editor configuration for a cell. Mirrors the static `dataEditor` /
 * `inlineEditor` column fields so a per-cell resolver (`editorForCell`) can
 * override either one for an individual cell.
 */
export interface CellEditors {
  dataEditor?: any;
  inlineEditor?: boolean | React.ComponentType<any> | string | null;
}

export interface ColumnSpec {
  name: string;
  key: string;
  required?: boolean;
  isValid?: (d: any) => boolean;
  transformValue?: (d: any) => any;
  valueRenderer?: (
    d: any,
    ctx?: CellRenderContext,
  ) => string | React.ReactNode;
  headerRenderer?: (d: any) => string | React.ReactNode;
  dataEditor?: any;
  /**
   * Choose the editor for an individual cell from its render context,
   * overriding the static `dataEditor` / `inlineEditor` for that cell. Return
   * `undefined` (or omit a key) to fall back to the static configuration —
   * e.g. show a textarea only for cells whose value is long. A returned key is
   * respected even when its value is `false`/`null` (i.e. "no editor here").
   */
  editorForCell?: (ctx: CellRenderContext) => CellEditors | undefined;
  /**
   * Render a read-only detail panel for a cell. When set, selecting the cell
   * opens a popover with this content (following the table's `cellInteraction`
   * mode). The panel never takes keyboard focus, so arrow keys keep navigating
   * the table; Escape closes it. Mutually distinct from `dataEditor` — use this
   * for non-editable surfaces (previews, summaries, links).
   */
  detailRenderer?: (ctx: CellRenderContext) => React.ReactNode;
  cellComponent?: any;
  category?: string;
  editable?: boolean;
  inlineEditor?: boolean | React.ComponentType<any> | string | null;
  style?: React.CSSProperties;
  width?: number;
  /** Column-specific table actions (TableAction[]). These appear in the
   * actions toolbar when this column is part of the current selection. */
  actions?: any[];
  /** Column-specific table filters (TableFilter[]). These appear in the
   * filter bar and apply to this column's values. */
  filters?: any[];
  /** Whether this column supports server-side sorting. */
  sortable?: boolean;
  /** Whether this column supports server-side filtering.
   * Set to `true` for default operators, or provide a config object
   * with a custom set of operators. */
  filterable?: boolean | { operators?: string[] };
  /** Inferred data type, used to select context-appropriate filter
   * operators when `filterable` is `true` without explicit operators. */
  dataType?: ColumnDataType;
}

export interface ColumnSpecOptions<T> {
  overrides: Record<string, Partial<ColumnSpec> | string>;
  data?: T[]; // Data to use for type inference
  nRows?: number; // Number of rows to use for type inference
  omitColumns?: string[]; // Columns to omit. Takes precedence over includeColumns.
  includeColumns?: string[]; // Columns to include.
}

export function generateDefaultColumnSpec<T>(
  data: Array<T>,
  options: ColumnSpecGenerateOptions = {},
): ColumnSpec[] {
  /** Build a default column spec from a dataset based on the first n rows */
  if (data == null) return [];
  // Get the keys

  const {
    defaultWidth = 150,
    calculateWidths = true,
    getWidthForValue = defaultWidthForValue,
  } = options;

  const keys = new Set<string>();
  const types = new Map();

  const columnWidths = new Map<string, number>();

  for (const row of data) {
    if (row == null) continue;
    for (const key of Object.keys(row)) {
      const val = row[key];
      keys.add(key);

      if (val == null) continue;

      if (calculateWidths) {
        let width = getWidthForValue(val);
        if (width != null && width >= 0) {
          columnWidths.set(key, Math.max(width, columnWidths.get(key) ?? 0));
        }
      }

      let type: string = typeof val;
      // Special 'type' for integers
      if (Number.isInteger(val)) {
        type = "integer";
      }

      // Special 'type' for arrays of simple values
      if (
        Array.isArray(val) &&
        val.every((d) => typeof d === "string" || typeof d === "number")
      ) {
        type = "array";
      }

      // Check if it is strictly a string, if so, we can explicitly mark it as text
      if (type === "string") {
        type = "text";
      }

      if (types.has(key)) {
        if (types.get(key) !== type) {
          if (type === "number" && types.get(key) === "integer") {
            types.set(key, "number");
          }
          if (type === "object" && types.get(key) === "array") {
            types.set(key, "object");
          }

          types.set(key, "string");
        }
      } else {
        types.set(key, type);
      }
    }
  }

  // Build a column spec
  const spec = [];
  for (const key of keys) {
    let width = null;
    if (calculateWidths) {
      // If we are calculating widths, use the value lengths
      width = Math.min(
        Math.max(defaultWidth / 2, columnWidths.get(key) ?? defaultWidth),
        defaultWidth * 1.5,
      );
    }

    const dataType = (types.get(key) ?? "string") as ColumnDataType;

    // Auto-infer sortable/filterable based on data type.
    // Scalar types (string, number, integer, boolean) get sort/filter;
    // complex types (object, array) do not.
    const isScalar =
      dataType === "text" ||
      dataType === "string" ||
      dataType === "number" ||
      dataType === "integer" ||
      dataType === "boolean";

    spec.push({
      name: key,
      key,
      valueRenderer: defaultRenderers[types.get(key)],
      width,
      dataType,
      sortable: isScalar,
      filterable: isScalar,
    });
  }
  return spec;
}

export function generateColumnSpec<T>(
  data: T[],
  options: ColumnSpecOptions<T>,
): ColumnSpec[] {
  /** Generate a column spec from a dataset */
  const {
    overrides = {},
    nRows = 10,
    omitColumns,
    includeColumns,
  } = options ?? {};

  if (data == null) return [];

  const _nRows = Math.min(nRows, data.length);

  let columnSpec = generateDefaultColumnSpec(data.slice(0, _nRows));
  let filteredSpec = columnSpec.filter((col) => {
    if (omitColumns != null && omitColumns.includes(col.key)) {
      return false;
    }
    if (includeColumns != null && !includeColumns.includes(col.key)) {
      return false;
    }
    return true;
  });

  // Apply overrides
  return filteredSpec.map((col) => {
    let ovr = overrides[col.key];
    if (ovr == null) return col;
    if (typeof ovr === "string") {
      return { ...col, name: ovr };
    }
    return { ...col, ...ovr };
  });
}
