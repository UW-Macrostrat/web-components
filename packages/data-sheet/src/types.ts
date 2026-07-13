import {
  DataSheetProviderProps,
  FetchData,
  TableDataProvider,
} from "./provider";
import type { ColumnSpec } from "./utils";
import { ComponentType, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { TableAction, TableFilter } from "./actions";
import { DataSheetInternalProps } from "./data-sheet.ts";

export interface DataPanelProps<T = any> {
  /** A data provider (read + optional persistence). Takes precedence. */
  provider?: TableDataProvider<T>;
  /** A loose windowed fetch (wrapped as a provider). */
  fetchData?: FetchData<T>;
  /** In-memory rows (wrapped in a local provider). */
  data?: T[];
  /** Row identity — stable across a provider re-sort. A provider supplies its
   * own; defaults to `(row) => row?.id`. */
  identity?: (row: T) => string | number | null | undefined;
  /** Column spec declaring facet capabilities (`filterable` / `sortable`) and
   * `dataType`. Drives `FacetControls` and the provider's server-side view. An
   * explicit array is used as-is; omit to auto-generate from the first chunk. */
  columnSpec?: ColumnSpec[];
  columnSpecOptions?: any;
  /** Renders one row as a card. */
  itemComponent: ComponentType<DataPanelItemProps<T>>;
  /** Selection-scoped and global actions (rendered in the toolbar). */
  actions?: TableAction<T>[];
  /** Table-level filters (column filters come from `columnSpec.filterable`). */
  filters?: TableFilter<T>[];
  /** Rows per chunk. */
  pageSize?: number;
  /** Shown as the toolbar's leading label when nothing is selected. */
  name?: string;
  /** Arbitrary nodes for the bottom status row (beside the loaded/total
   * counter). Pass `false` to drop the status row entirely — e.g. when the
   * counter is folded into an inline footer instead. */
  statusBar?: ReactNode | false;
  /** Custom header controls, replacing the default `FacetControls` +
   * `FilterBar`. Rendered inside the provider, so it can drive sort/filter via
   * the exported building blocks (`FacetControls`, `FilterBar`) and the store
   * hooks (`useStoreAPI` / `useSelector`). The selection `ActionsToolbar` still
   * renders above it. Omit for the sane default. */
  toolbar?: ReactNode;
  /** A filter/detail sidebar beside the scroll body (its own scroll). Rendered
   * inside the provider, so a custom filter panel drives sort/filter through
   * the store hooks — the alternative placement to the top `toolbar`. */
  sidebar?: ReactNode;
  /** Footer content. Rendered inside the provider, so it reads live load state
   * from the store via `useLoadControls()` (loadMore / loading / hasMore /
   * loaded / total / paused) rather than a passed-down contract — a footer, a
   * status line, or a "Load more" button all just call the hook. */
  contentFooter?: ReactNode;
  /** Auto-load this many pages per burst, then pause: a paused panel stops
   * fetching on scroll until `useLoadControls().loadMore()` starts the next
   * burst (e.g. a footer "Load more" button). Omit for unbounded auto-scroll. */
  // TODO: we may deprecate this for opt-in scrolling
  autoLoadPages?: number;
  /** Bump to force a re-fetch from scratch (e.g. after an immediate edit that
   * mutated rows through the provider). */
  refreshToken?: number | string;
  /** Custom layout for the item cards — the seam for anything other than a
   * vertical list (a CSS grid for several per row, grouped sections, sticky
   * sub-headers, a windowed renderer). Receives the rendered cards as
   * `children`; the panel still owns the scroll container and the loading
   * sentinel, so paging and selection keep working. Defaults to a vertical
   * flex list. */
  scrollBody?: ComponentType<ScrollBodyProps>;
  /** Fade the top of the scroll content as it slips under the toolbar. Only
   * active once scrolled (so the first item isn't clipped at rest). Default
   * `true`. */
  topFade?: boolean;
  className?: string;
}

/** Selection modifier keys, following the familiar list idiom. */
export interface SelectModifiers {
  /** cmd/ctrl — toggle this row in/out of the selection (or extend a range). */
  additive?: boolean;
  /** shift — select the range from the anchor (last plain/cmd click) to here. */
  range?: boolean;
}

/** Props for a custom scroll-body layout component. It receives the
 * already-rendered, selection-wrapped item cards and lays them out however it
 * likes (a grid, sections, sticky headers, its own windowing). The panel owns
 * the surrounding scroll container and the loading sentinel; the scroll body
 * only arranges the items. */
export interface ScrollBodyProps {
  /** The rendered item cards (each wrapped for selection styling). */
  children: ReactNode;
}

/** Props handed to a consumer's card renderer for one row. */
export interface DataPanelItemProps<T = any> {
  /** The row's data. */
  data: T;
  /** Underlying data-row index (stable within a loaded window). */
  index: number;
  /** Whether this row is in the current selection. */
  selected: boolean;
  /** Select this row. Pass the click's `MouseEvent` (or `React.MouseEvent`) to
   * honor shift / cmd / ctrl automatically — the usual wiring is
   * `onClick: onSelect`. Or pass an explicit `SelectModifiers` object; no
   * argument means a plain (replace) select. */
  onSelect: (arg?: SelectModifiers | ReactMouseEvent) => void;
}
export enum DataSheetDensity {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export type DataSheetProps<T> = DataSheetProviderProps<T> &
  DataSheetInternalProps<T>;
