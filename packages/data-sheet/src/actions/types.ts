import type { IconName, Intent } from "@blueprintjs/core";
import type { ComponentType, ReactNode } from "react";
import { SelectionCardinality } from "./selection.ts";
import { TableActionContext } from "./context.ts";

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
  describeState?: (state: S) => ReactNode;
  /** The entity (e.g., a column) being described. */
  subject?: string;
  /** Row predicate: return `true` if the row should be visible.
   * Receives the merged row (updatedData overlaid on data). */
  predicate(row: T, state: S): boolean;
}

/** An active filter entry stored in the table state. */
export interface ActiveFilterEntry<T = any> {
  filter: TableFilter<T>;
  state: any;
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

  /** Menu-native rendering for a menu surface (the column-header dropdown):
   * return `MenuItem`(s) — e.g. sort as a submenu, or a filter list where each
   * filter is an item opening its form in a submenu. When present, the
   * column-header menu uses this instead of `render` (which stays for the
   * toolbar's inline/popover control). May return multiple items (a fragment).*/
  renderMenuItem?: (context: TableActionContext<T>) => ReactNode;

  /** Execute the action. May be synchronous (local state manipulation)
   * or asynchronous (backend fulfillment). For lazy-loaded tables,
   * async actions are required when targeting non-loaded cells.
   * Optional for `render`-only controls. */
  run?(context: TableActionContext<T>, state?: S): void | Promise<void>;
  successMessage?: string;
  errorMessage?: string;
  hotkey?: string;
}
