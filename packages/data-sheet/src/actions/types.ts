import type { IconName, Intent } from "@blueprintjs/core";
import type { Region, RegionCardinality } from "@blueprintjs/table";
import type { ComponentType } from "react";
import type { ColumnSpec } from "../utils";
import { TableElementStatus } from "../types.ts";

/** Selection cardinality including the case of no active selection */
export type SelectionCardinality = RegionCardinality | "none";

/** A single cell edit, used with `editCells` for batch updates. */
export interface CellEdit {
  rowIndex: number;
  columnKey: string;
  value: any;
}

/** Context passed to an action's `run` function, providing both data access
 * and store manipulation methods. Constructed fresh at action-run time
 * to ensure current state. */
export interface TableActionContext<T = any> {
  /** Current selection regions */
  selection: Region[];
  /** Derived cardinality of the current selection */
  selectionCardinality: SelectionCardinality;
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
  resetChanges(): void;
  clearSelection(): void;
  scrollToRow(rowIndex: number): void;
  /** Direct store mutation for cases not covered by the convenience methods
   * above (e.g., modifying `columnSpec` or `deletedRows`). */
  setState(partial: Record<string, any>): void;
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

  /** Execute the action. May be synchronous (local state manipulation)
   * or asynchronous (backend fulfillment). For lazy-loaded tables,
   * async actions are required when targeting non-loaded cells. */
  run(context: TableActionContext<T>, state?: S): void | Promise<void>;
}
