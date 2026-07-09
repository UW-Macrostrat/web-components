import type { IconName, Intent } from "@blueprintjs/core";
import type { Region, RegionCardinality } from "@blueprintjs/table";
import type { ComponentType, ReactNode } from "react";
import type { ColumnSpec } from "../utils";
import { ClipboardProxy, TableElementStatus } from "../types.ts";

/** Selection cardinality including the case of no active selection */
export type SelectionCardinality = RegionCardinality | "none";

/** The concrete *shape* of the current selection — richer than cardinality
 * alone. The "single X" cases are exposed as resolved identity fields on the
 * action context (`columnKey`, `rowIndex`, `cell`); this carries the counts. */
export interface SelectionShape {
  cardinality: SelectionCardinality;
  /** Number of columns the selection spans (0 when not column-scoped). */
  columns: number;
  /** Number of rows the selection spans (0 when not row-scoped). */
  rows: number;
}

/** A single cell edit, used with `editCells` for batch updates. */
export interface CellEdit {
  rowIndex: number;
  column: string;
  value: any;
}

/** A column filter that can be activated to hide non-matching rows.
 * Parallel to `TableAction` but with persistent state while active.
 * Follows the same `{ state, setState }` form pattern.
 *
 * @typeParam T - Row data type
 * @typeParam S - Filter configuration state type
 */
export interface TableFilter<T = any, S = any> {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Blueprint icon */
  icon?: IconName;
  /** Description shown in the filter popover */
  description?: string;
  /** Column this filter targets. Automatically set when defined in a ColumnSpec. */
  columnKey?: string;
  /** Default filter configuration state */
  defaultState?: S;
  /** Component for configuring the filter value.
   * Same `{ state, setState }` pattern as `TableAction.detailsForm`. */
  filterForm?: ComponentType<{ state: S; setState(state: S): void }>;
  /** Summarize the current filter state for display on the active-filter tag
   * (e.g. the range `0–250` or the search term). Keep it short — the tag also
   * shows the filter name. Return `null` to show just the name. */
  describeState?: (state: S) => import("react").ReactNode;
  /** Row predicate: return `true` if the row should be visible.
   * Receives the merged row (updatedData overlaid on data). */
  predicate(row: T, state: S): boolean;
}

/** An active filter entry stored in the table state. */
export interface ActiveFilterEntry<T = any> {
  filter: TableFilter<T>;
  state: any;
}

// Re-export ColumnSort from the main types module (defined there to
// avoid a circular import, since actions/types imports from types.ts).
export type { ColumnSort } from "../types.ts";

/** Context passed to an action's `run` function, providing both data access
 * and store manipulation methods. Constructed fresh at action-run time
 * to ensure current state. */
export interface TableActionContext<T = any> {
  /** Current selection regions */
  selection: Region[];
  /** Derived cardinality of the current selection */
  selectionCardinality: SelectionCardinality;
  /** Concrete shape of the current selection (cardinality + column/row counts). */
  selectionShape: SelectionShape;
  /** The single selected column's key when exactly one column is scoped
   * (a single full column, or cells within one column); otherwise `null`. */
  columnKey: string | null;
  /** The single selected data-row index when exactly one row is scoped;
   * otherwise `null`. */
  rowIndex: number | null;
  /** The single selected cell (data-row index + column key) when exactly one
   * cell is selected; otherwise `null`. Presence of these resolved fields is
   * how actions discriminate selection shape — e.g. `appliesTo: ctx =>
   * ctx.cell != null` for a single-cell control, or `ctx.columnKey != null`
   * within a `FULL_COLUMNS` target for a single-column control. */
  cell: { rowIndex: number; columnKey: string } | null;
  /** The table's base data */
  data: T[];
  /** Sparse overlay of edited data */
  updatedData: T[];
  /** Row status tracking added/deleted rows */
  rowStatus: TableElementStatus[];
  /** Column definitions */
  columnSpec: ColumnSpec[];
  /** Whether the table is in edit mode */
  editable: boolean;
  /** Whether row deletion is available (false when the provider can't delete). */
  canDeleteRows: boolean;

  // Convenience methods (derived from selection)
  /** Row indices covered by the current selection */
  getSelectedRowIndices(): number[];
  /** Column keys covered by the current selection */
  getSelectedColumnKeys(): string[];

  // Store manipulation methods
  onCellEdited(rowIndex: number, columnKey: string, value: any): void;
  /** Edit multiple cells in a single batch update. Preferred over calling
   * `onCellEdited` in a loop, which triggers separate store updates
   * and may produce inconsistent intermediate states. */
  editCells(edits: CellEdit[]): void;
  deleteSelectedRows(): void;
  addRow(row?: Partial<T>): void;
  setUpdatedData(data: any): void;
  resetChanges(region?: Region[]): void;
  clearSelection(): void;
  scrollToRow(rowIndex: number): void;
  /** Direct store mutation for cases not covered by the convenience methods
   * above (e.g., modifying `columnSpec` or `deletedRows`). */
  setState(partial: Record<string, any>): void;

  // Clipboard proxy support
  /** Active clipboard proxy from a prior copy, if any */
  clipboardProxy: ClipboardProxy | null;
  /** Store a clipboard proxy for potential backend-mediated paste */
  setClipboardProxy(proxy: ClipboardProxy | null): void;

  // Filter support
  /** Row index mapping when filters are active. When non-null,
   * visible row `i` maps to data row `filteredRowIndices[i]`. */
  filteredRowIndices: number[] | null;
}

/** Definition of a table action. Follows the `ActionDef` pattern from
 * `@macrostrat/form-components` with table-specific extensions.
 *
 * @typeParam T - Row data type
 * @typeParam S - Configuration state type (for actions with a `detailsForm`)
 */
export interface TableAction<T = any, S = null> {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Group name (for grouping actions together) */
  group?: string;
  /** Blueprint icon name */
  icon?: IconName;
  /** Visual intent (e.g., "danger" for destructive actions) */
  intent?: Intent;
  /** Description shown as tooltip or in the details panel */
  description?: string;

  /** Which selection cardinalities this action applies to.
   * The action will appear in the toolbar when the current selection
   * matches any of these cardinalities. Use `"none"` for actions that
   * should be available even with no active selection. */
  targets: SelectionCardinality[];

  /** Optional refinement beyond `targets`, inspecting the resolved selection
   * identity. Return `false` to hide the action for a given shape — e.g. sort
   * and filter return `ctx.columnKey != null` (within their `FULL_COLUMNS`
   * target), so they appear only for a single column. */
  appliesTo?: (context: TableActionContext<T>) => boolean;

  /** Whether this action requires the table to be in edit mode.
   * Defaults to `true`. Set to `false` for read-only actions
   * (e.g., "open URL", "copy to clipboard"). */
  requiresEditable?: boolean;

  /** Whether the action is currently disabled. Can be a static boolean
   * or a function that receives the current context for dynamic checks. */
  disabled?: boolean | ((context: TableActionContext<T>) => boolean);

  /** Default configuration state for the action's preflight form */
  defaultState?: S;
  /** Component for pre-run configuration, rendered in a popover.
   * Follows the same pattern as `ActionDef.detailsForm` from
   * `@macrostrat/form-components`. */
  detailsForm?: ComponentType<{ state: S; setState(state: S): void }>;
  /** Check if the action is ready to run given its configuration state */
  isReady?: (state: S) => boolean;

  /** For live/stateful controls (a column sort or filter widget, say): render
   * bespoke UI for the current context instead of the default action button.
   * When present, the toolbar renders this and ignores `detailsForm` (and
   * `run`, unless the control itself invokes it). This is how sort/filter/group
   * are expressed as `FULL_COLUMNS`-scoped controls in the one action system. */
  render?: (context: TableActionContext<T>) => ReactNode;

  /** Execute the action. May be synchronous (local state manipulation)
   * or asynchronous (backend fulfillment). For lazy-loaded tables,
   * async actions are required when targeting non-loaded cells.
   * Optional for `render`-only controls. */
  run?(context: TableActionContext<T>, state?: S): void | Promise<void>;
  successMessage?: string;
  errorMessage?: string;
  hotkey?: string;
}
