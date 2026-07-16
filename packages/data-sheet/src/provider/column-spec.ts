import React from "react";
import { enhanceColumnFilter, TableFilter } from "../actions";

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

/** Severity of a cell validation result. `warning` is soft (flagged, doesn't
 * block saving); `error` is hard (blocks saving). */
export type ValidationSeverity = "warning" | "error";

/** The result of validating a cell. `null` means valid. */
export interface CellValidation {
  severity: ValidationSeverity;
  message?: string;
}

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
  /** The row's status value (`RowStatusValue`) — `"deleted"` / `"added"` or a
   * consumer-defined status (e.g. `"omitted"`), or `undefined` for a normal
   * row. Lets a renderer style by arbitrary status, not just deletion. */
  status: string | undefined;
  /** Validation result for this cell, or `null` when valid. Orthogonal to the
   * edit status — a cell can be both edited and invalid. */
  validation: CellValidation | null;
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

/**
 * Context for a cell's detail surface (`cellDetail`). Extends the render
 * context with the edit affordances and controls a surface needs, so one
 * component can act as an editor (when `editable`) or a read-only viewer
 * (otherwise). This is the write side of the read/write contract, per-cell.
 */
export interface CellDetailContext<T = any> extends CellRenderContext<T> {
  /** Whether this cell is editable (column × table × not-deleted). */
  editable: boolean;
  /** Commit a new value for this cell. */
  onChange: (value: any) => void;
  /** Reset this cell (and selection) to its base value. */
  resetValue: () => void;
  /** Close the surface and return focus to the table. */
  close: () => void;
}

/** How a cell's detail surface is presented. Orthogonal to what it renders. */
export type DetailPresentation = "popover" | "modal" | "inline";

export interface ColumnSpec {
  name: string;
  key: string;
  /** When true, an empty value is an error (sugar over `validate`). */
  required?: boolean;
  /** Validate a cell's value. Return a `{ severity, message }` for a
   * warning/error, or `null` when valid. Runs after the `required` check.
   * `warning` flags the cell but allows saving; `error` blocks saving. */
  validate?: (
    value: any,
    row: any,
    ctx: { rowIndex: number },
  ) => CellValidation | null;
  /** @deprecated Prefer `validate`, which carries severity + a message.
   * A falsy result maps to an `error`. */
  isValid?: (d: any) => boolean;
  transformValue?: (d: any) => any;
  valueRenderer?: (d: any, ctx?: CellRenderContext) => string | React.ReactNode;
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
   *
   * @deprecated Prefer `cellDetail`, which unifies editor and viewer.
   */
  detailRenderer?: (ctx: CellRenderContext) => React.ReactNode;
  /**
   * The unified cell surface (Workstream A): one renderer that acts as an
   * editor when `ctx.editable` and a read-only viewer otherwise, superseding
   * `dataEditor` / `detailRenderer` / `editorForCell`. Presentation is chosen
   * separately via `detailPresentation` (popover / modal / inline), so the
   * same component works in any container.
   */
  cellDetail?: (ctx: CellDetailContext) => React.ReactNode;
  /** How `cellDetail` is presented. Defaults to `"popover"`. */
  detailPresentation?: DetailPresentation;
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
  /** Whether this column may be drag-reordered. Defaults to `true`; set
   * `false` to pin a fixed/system column in place. Applied by the default
   * header renderer (requires table-level `enableColumnReordering`). */
  reorderable?: boolean;
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
  const spec: ColumnSpec[] = [];
  for (const key of keys) {
    let width: number | undefined = undefined;
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
  options: Partial<ColumnSpecOptions<T>> = {},
): ColumnSpec[] {
  /** Generate a column spec from a dataset */
  const { overrides = {}, nRows = 10, omitColumns, includeColumns } = options;

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
  const improvedSpec = filteredSpec.map((col) => {
    let ovr = overrides[col.key];
    if (ovr == null) return col;
    if (typeof ovr === "string") {
      return { ...col, name: ovr };
    }
    return { ...col, ...ovr };
  });
  return postprocessColumnSpec(improvedSpec);
}

export function postprocessColumnSpec(columnSpec: ColumnSpec[]) {
  /** Postprocess column spec to make sure that, e.g., column filters are
   * properly established, etc.
   */
  return columnSpec.map((col) => {
    return {
      ...col,
      filters: postprocessColumnFilters(col),
      actions: col.actions ?? [],
    };
  });
}

function postprocessColumnFilters(col: ColumnSpec): TableFilter[] {
  const { filterable = true, filters = [] } = col;
  if (!filterable) {
    return [];
  }
  return filters.map((f) => enhanceColumnFilter(col, f));
}
