import {
  EditEvent,
  FetchData,
  InteractionOptions,
  RowHeaderRenderContext,
  RowStatusStyles,
  TableDataProvider,
  TableElementStatus,
  VisibleCells,
} from "./provider";
import type { ColumnSpec, ColumnSpecOptions } from "./provider";
import { ReactNode } from "react";
import { TableAction, TableActionContext, TableFilter } from "./actions";
import { Region, TableProps } from "@blueprintjs/table";

export type FetchMode = "scroll" | "paged";

export interface FetchDataOptions {
  pageSize?: number;
  fetchMode?: FetchMode;
}

/** Props shared between the wrapper components and the provider */
export interface DataViewCoreProps<T> extends InteractionOptions {
  /** In-memory rows. Internally wrapped in a local `TableDataProvider` and
   * driven through the same loader as any other source. */
  data?: T[];
  /** Column definitions. Either a static array, or a function derived from the
   * loaded rows — invoked once the first rows arrive (and re-invoked when the
   * function's identity changes), so a data-shaped spec needs no separate fetch
   * of sample data. Omit entirely to auto-generate a plain spec via
   * `columnSpecOptions`. */
  columnSpec?: ColumnSpec[] | ((rows: T[]) => ColumnSpec[]);
  columnSpecOptions?: ColumnSpecOptions<T>;
  enableColumnReordering?: boolean;
  defaultColumnWidth?: number;
  // function to fetch a chunk of data (the read side of a data provider)
  fetchData?: FetchData<T>;
  /** A data provider instantiated separately and passed in — bundles the read
   * side (`fetchData` + `identity`) and, optionally, the persistence side
   * (`saveRows` / `deleteRows` / `insertRow`) that drives the Save action. An
   * explicit alternative to the loose `data` / `fetchData` / `identity` props;
   * takes precedence when given. */
  provider?: TableDataProvider<T>;
  /** Row identity for the edit overlay — stable across a provider re-sort (a
   * data provider supplies its own; defaults to `(row) => row?.id`). Lets edits
   * survive a re-ordered re-fetch. */
  identity?: (row: T) => string | number | null | undefined;
  /** Shown as the toolbar's leading label when nothing is selected. */
  name?: string;
  // itemLabel (e.g., "row", "item")
  itemLabel?: string;
  /** Bump to force a re-fetch from scratch (e.g. after an immediate edit that
   * mutated rows through the provider). */
  refreshToken?: number | string;
}

export interface DataViewSharedProps<T = any>
  extends FetchDataOptions, DataViewCoreProps<T> {
  /** Configurable table actions shown in a selection-aware toolbar.
   * When provided, the actions toolbar renders alongside the existing
   * edit toolbar. Actions are filtered by the current selection cardinality. */
  actions?: TableAction<T>[];
  /** Available column/table filters shown in a filter bar.
   * Filters can also be defined per-column via `ColumnSpec.filters`. */
  filters?: TableFilter<T>[];
  //enableSelection?: boolean;
}

export enum DataSheetDensity {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

/**
 * How selecting a cell activates its surface (an editor, or a read-only detail
 * panel):
 * - `"auto"` (default when `autoFocusEditor` is `true`): open the surface on
 *   selection and, for editors, focus it. Editors relinquish focus at their
 *   edges — arrow past the start/end of a text cell, or press Escape, and focus
 *   returns to the table — so the keyboard stays operable without the mouse.
 *   Pressing Escape drops into navigation mode (surfaces stop auto-opening)
 *   until the next click.
 * - `"manual"` (default when `autoFocusEditor` is `false`): the surface stays
 *   closed until the cell is clicked; arrow keys always navigate the table.
 */
export type CellInteraction = "auto" | "manual";

export interface DataSheetRendererProps<T = any>
  extends TableProps, DataViewSharedProps<T> {
  onVisibleCellsChange?: (visibleCells: VisibleCells) => void;
  onUpdateData?: (updatedData: any[], data: T[]) => void;
  /** Observer called for every user edit as a structured `EditEvent`
   * (Workstream A). Additive: the built-in `updatedData` overlay still
   * applies. */
  onEdit?: (event: EditEvent<T>) => void;
  /** Controlled edited-cell overlay (Workstream A). When provided, it is
   * synced into the store as the source of truth for edited values — pair with
   * `onEdit` to own edit state externally (e.g. an ops model). Optimistic
   * in-table edits are superseded by the next value you pass back. */
  updatedData?: T[];
  /** Controlled row-status overlay (edited / added / deleted), the companion
   * to `updatedData`. */
  rowStatus?: TableElementStatus[];

  /** Derive the controlled edit overlay from the loaded rows, *inside* the
   * sheet. For provider-backed tables whose overlay is a function of the loaded
   * data plus external edit state (e.g. an ops stack): the library owns the
   * rows, so it calls this with them and uses the result as the controlled
   * overlay, re-deriving when the rows — or this function's identity (close it
   * over your edit state) — change. Supersedes `updatedData`/`rowStatus`. */
  deriveOverlay?: (rows: T[]) => {
    updatedData: T[];
    rowStatus: TableElementStatus[];
  };
  /** Persistence handler for the built-in Save action. When provided, a Save
   * control is added to the toolbar (always visible, disabled when there are
   * no pending changes). */
  onSave?: (ctx: TableActionContext<T>) => void | Promise<void>;
  onDeleteRows?: (selection: Region[]) => void;
  verbose?: boolean;
  enableColumnReordering?: boolean;
  enableClipboard?: boolean;
  enableFocusedCell?: boolean;
  /** @deprecated Prefer `cellInteraction`. `true` maps to `"auto"`,
   * `false` to `"manual"`. */
  autoFocusEditor?: boolean;
  /** How selecting a cell activates its surface (editor or detail panel).
   * Defaults from `autoFocusEditor` for backward compatibility. */
  cellInteraction?: CellInteraction;
  density?: DataSheetDensity;
  /** Optional custom column header cell renderer, called for each column.
   * Receives the ColumnSpec and column index; should return a React element
   * (typically a Blueprint ColumnHeaderCell). */
  columnHeaderCellRenderer?: (col: any, colIndex: number) => ReactNode;
  /** Arbitrary nodes for the bottom status bar (left group), rendered beside
   * the active sort/filter tags — the home for view-state controls (show/hide
   * omitted rows/columns, a group-by indicator, etc.). */
  statusBar?: ReactNode;
  /** Presentation per row-status value, merged over the built-in defaults
   * (which style `"deleted"`). Supply styles for consumer-defined statuses
   * (e.g. `"omitted"`) and/or override the defaults. Each entry may set the
   * cells' style/intent and the row header's style. */
  rowStatusStyles?: RowStatusStyles;
  /** Render the content of a row's header cell (the left gutter). Receives the
   * row, its status, and the default 1-based label; return a node to use, or a
   * nullish value to keep the default. For group-key labels, omit indicators,
   * etc. Header-cell *styling* still comes from `rowStatusStyles`. */
  rowHeaderRenderer?: (ctx: RowHeaderRenderContext<T>) => ReactNode;
  minRowHeight: number;
  defaultColumnWidth: number;
  debug: boolean;
}

export type DataSheetProps<T> = DataViewCoreProps<T> &
  DataSheetRendererProps<T>;
