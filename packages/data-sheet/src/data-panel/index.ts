/**
 * DataPanel — a card/list renderer over the same headless core as `DataSheet`.
 *
 * The two components differ in only two dimensions: the **view** (cards vs. the
 * Blueprint cell grid) and **edit granularity** (immediate per-item vs. a
 * batched pending-ops stack). Everything else — provider-driven windowed
 * loading, `{sorts, filters}` view state, the selection set, and set-based
 * actions — is the shared substrate, reused here unchanged:
 *
 * - `DataSheetProvider` supplies the jotai+zustand store.
 * - `useDataLoader(provider.fetchData)` drives windowed loading and threads the
 *   active store sorts/filters through so a server provider applies them.
 * - `ActionsToolbar` + `FilterBar` render selection-aware actions and the
 *   active sort/filter tags — they read the store, not the table.
 *
 * The only list-specific pieces are: rows rendered as cards via a consumer
 * `itemComponent`; selection expressed as `FULL_ROWS` regions (so the existing
 * row-targeted `TableAction`s apply); an infinite-scroll sentinel that advances
 * the loader's visible region; and `FacetControls`, which stands in for the
 * column-header dropdown the list doesn't have (a menu to add a column filter /
 * sort from the column-declared `filterable` / `sortable` capabilities).
 *
 * See [[Data list editors]] in the Macrostrat workbench for the design.
 */
import h from "./data-panel.module.sass";
import {
  ComponentType,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  UIEvent as ReactUIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Region } from "@blueprintjs/table";
import { Button, Menu, PopoverNext, Spinner } from "@blueprintjs/core";
import {
  ctx,
  DataSheetProvider,
  dataProviderAtom,
  useResolvedProvider,
  useSelector,
  useStoreAPI,
} from "../provider";
import { ErrorBoundary, ToasterContext } from "@macrostrat/ui-components";
import type { ColumnSpec } from "../utils";
import {
  ActionsToolbar,
  ColumnFilterMenuItem,
  ColumnSortMenu,
  FilterBar,
  getSelectedRowIndices,
  isColumnFilterable,
  resolveColumnFilter,
  TableAction,
  TableFilter,
} from "../actions";
import {
  dataRefreshTokenAtom,
  FetchData,
  FetchDataOptions,
  tableFooterAtom,
  TableDataProvider,
  useDataLoader,
  useScrollHandler,
} from "../postgrest-table";

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
  /** Footer content. A function receives live load controls — `loadMore`,
   * `loading`, `hasMore`, `loaded`, `total`, `paused` — for e.g. a "Load more"
   * button that resumes a paused auto-load, or a folded-in counter. */
  footer?: ReactNode | ((controls: LoadControls) => ReactNode);
  /** Where the footer sits:
   * - `"below"` (default): a pinned region below the scroll, always visible.
   * - `"inline"`: the last thing in the *scroll flow* — seen only when the
   *   bottom is reached, and it doubles as the load sentinel (so it can show a
   *   spinner mid-burst and a "Load more" at a pause). Keeps all chrome out of
   *   the scrolling content until you get there. */
  footerPlacement?: "below" | "inline";
  /** Auto-load this many pages per burst, then pause: a paused panel stops
   * fetching on scroll until `LoadControls.loadMore` starts the next burst
   * (e.g. a footer "Load more" button). Omit for unbounded auto-scroll. */
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

/** Live loading controls handed to a function `footer` — enough to render a
 * "Load more" button, a progress readout, or a paused-state prompt. */
export interface LoadControls {
  /** Resume auto-loading and fetch the next page (clears a paused state). */
  loadMore: () => void;
  /** A fetch is in flight. */
  loading: boolean;
  /** More rows remain to load. */
  hasMore: boolean;
  /** Rows loaded so far. */
  loaded: number;
  /** Source total when known, else `null`. */
  total: number | null;
  /** Auto-load is paused (hit the `autoLoadPages` checkpoint). */
  paused: boolean;
}

/**
 * Resolve the data source (shared with `DataSheet` / `DataView` via
 * `useResolvedProvider`), wrap in the shared provider, and render the inner
 * panel.
 */
export function DataPanel<T>(props: DataPanelProps<T>) {
  const { data, columnSpec, columnSpecOptions, ...rest } = props;
  const { data: _data, dataProvider } = useResolvedProvider<T>(props);

  return h(
    ErrorBoundary,
    h(
      ToasterContext,
      h(
        DataSheetProvider<T>,
        {
          data: _data,
          columnSpec,
          columnSpecOptions,
          editable: true,
          dataProvider,
        },
        h(_DataPanel<any>, { data: _data, ...rest }),
      ),
    ),
  );
}

/** The card-list renderer. Assumes it is rendered inside a `DataSheetProvider`
 * (the `DataPanel` wrapper, or `DataView`). Exported so a shared-store
 * `DataView` can mount it directly alongside `_DataSheet`. */
export function _DataPanel<T>({
  data: sourceData,
  itemComponent: ItemComponent,
  actions,
  filters,
  pageSize = 50,
  name,
  statusBar,
  toolbar,
  sidebar,
  footer: footerSlot,
  footerPlacement = "below",
  autoLoadPages,
  refreshToken,
  scrollBody,
  topFade = true,
  className,
}: Omit<DataPanelProps<T>, "provider" | "fetchData" | "identity"> & {
  data?: T[];
}) {
  const { provider: activeProvider, isLocalProvider } =
    ctx.useValue(dataProviderAtom);

  // The loader is mounted as a child component (below), NOT called as a hook
  // here, and only once `activeProvider` resolves. This mirrors `_DataSheet`:
  // `dataProviderAtom` is synced by a parent effect that fires *after* this
  // component's effects, so a hook call here would capture the placeholder
  // provider on first render and — since `fetchData` isn't one of its effect
  // deps — never re-fetch with the real one. A child that mounts with the real
  // `fetchData` already in hand sidesteps that entirely.
  const loaderPageSize = isLocalProvider
    ? Math.max(sourceData?.length ?? 1, 1)
    : pageSize;

  const data = useSelector((s) => s.data);
  const selection = useSelector((s) => s.selection);
  const storeAPI = useStoreAPI();
  const footer = ctx.useValue(tableFooterAtom);

  // Track whether the body is scrolled off the top, to gate the top fade.
  // `setState` with an unchanged value is a no-op, so this only re-renders on
  // the at-top ↔ scrolled transition.
  const [scrolled, setScrolled] = useState(false);
  const onBodyScroll = useCallback(
    (e: ReactUIEvent<HTMLDivElement>) => {
      setScrolled(e.currentTarget.scrollTop > 4);
    },
    [],
  );

  const selectedIndices = useMemo(
    () => new Set(getSelectedRowIndices(selection)),
    [selection],
  );

  // The anchor for shift-range selection: the last row clicked without shift.
  // Reset when the selection is cleared elsewhere (e.g. the toolbar's ✕).
  const anchorRef = useRef<number | null>(null);
  useEffect(() => {
    if (selection == null || selection.length === 0) anchorRef.current = null;
  }, [selection]);

  // A card list has no cells or columns. When the selection carries columns —
  // inherited from a shared store the sheet also drives (a `DataView` toggle) —
  // coerce it to the full rows it covers, so the toolbar shows row-scoped
  // actions rather than column/cell ones for a column that isn't visible here.
  // Column-only selections (no rows) collapse to nothing. Self-limiting: the
  // panel's own selections never carry columns, so this only fires on inherit.
  useEffect(() => {
    if (selection == null || !selection.some((r) => r.cols != null)) return;
    storeAPI.setState({
      selection: indicesToRegions(new Set(getSelectedRowIndices(selection))),
      focusedCell: null,
      topLeftCell: null,
    });
  }, [selection, storeAPI]);

  // Selection is expressed as `FULL_ROWS` regions (contiguous runs merged into
  // ranges) so the existing row-targeted action machinery (toolbar title,
  // `getSelectedRowIndices`, delete/tag actions) applies unchanged. Modifier
  // keys follow the familiar list idiom: plain = replace, cmd/ctrl = toggle one,
  // shift = range from the anchor.
  const select = useCallback(
    (index: number, mods: SelectModifiers) => {
      const current = new Set(getSelectedRowIndices(storeAPI.getState().selection));
      let next: Set<number>;
      if (mods.range && anchorRef.current != null) {
        const a = anchorRef.current;
        const [lo, hi] = a <= index ? [a, index] : [index, a];
        // Shift extends the existing selection when combined with cmd/ctrl,
        // otherwise replaces it with the range. The anchor stays put so the
        // range can be re-dragged from the same origin.
        next = mods.additive ? new Set(current) : new Set();
        for (let i = lo; i <= hi; i++) next.add(i);
      } else if (mods.additive) {
        next = new Set(current);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        anchorRef.current = index;
      } else {
        next = new Set([index]);
        anchorRef.current = index;
      }
      storeAPI.setState({
        selection: indicesToRegions(next),
        focusedCell: null,
        topLeftCell: null,
      });
    },
    [storeAPI],
  );

  const onScroll = useScrollHandler();
  const loadedCount = useMemo(() => {
    let n = 0;
    for (const r of data) if (r != null) n++;
    return n;
  }, [data]);

  // Bump the shared refresh token when the caller's `refreshToken` changes, so
  // an immediate edit (mutate rows via the provider) can force a re-fetch.
  const bumpRefresh = ctx.useSet(dataRefreshTokenAtom);
  const firstRefresh = useRef(true);
  useEffect(() => {
    if (firstRefresh.current) {
      firstRefresh.current = false;
      return;
    }
    bumpRefresh((v) => v + 1);
  }, [refreshToken, bumpRefresh]);

  // Wire provider-backed, auto-refreshing row mutations into the store, so a
  // selection action can persist an edit via the action context
  // (`ctx.saveRows` / `deleteRows` / `insertRow`) with no `refreshToken`
  // plumbing — each awaits the provider then re-fetches. Present only for the
  // capabilities the provider actually supports.
  useEffect(() => {
    const p = activeProvider;
    const refresh = () => bumpRefresh((v) => v + 1);
    const withRefresh =
      <A extends any[]>(fn?: (...args: A) => Promise<void>) =>
        fn == null
          ? undefined
          : async (...args: A) => {
              await fn(...args);
              refresh();
            };
    storeAPI.setState({
      rowEditing: {
        saveRows: withRefresh(p?.saveRows?.bind(p)),
        deleteRows: withRefresh(p?.deleteRows?.bind(p)),
        insertRow: withRefresh(p?.insertRow?.bind(p)),
        refresh,
      },
    });
  }, [storeAPI, activeProvider, bumpRefresh]);

  // More to load iff the loader-sized array still has unfilled (null) slots.
  // This tracks the loader's own sizing: exact `totalCount` when known, a
  // trailing page of null padding while an unknown-length source hasn't run
  // dry, and exactly `loadedCount` once it has (→ no more). So a short filtered
  // result reports "done" instead of chasing a phantom next page.
  const hasMore = !isLocalProvider && loadedCount < data.length;

  // Auto-load checkpoint: after `autoLoadPages` pages past the resume point,
  // pause — the sentinel stops firing until `loadMore` moves the baseline. Lets
  // a footer interrupt infinite scroll with a "Load more" button.
  const [resumeBaseline, setResumeBaseline] = useState(0);
  const paused =
    autoLoadPages != null &&
    loadedCount - resumeBaseline >= autoLoadPages * pageSize;
  const canLoadMore = hasMore && !footer.loading && !paused;

  // Advance the loader's visible region by exactly one page. Bounded to
  // `data.length` so a filtered result shorter than a page doesn't point past
  // the array at phantom nulls (which the loader would refetch forever).
  const requestMore = useCallback(() => {
    const end = Math.min(loadedCount + pageSize, data.length);
    onScroll({ rowIndexStart: 0, rowIndexEnd: end });
  }, [onScroll, loadedCount, pageSize, data.length]);

  // Manual load (footer "Load more"): move the pause baseline to now — which
  // un-pauses — and nudge a fetch. Auto-scroll then resumes until the next
  // checkpoint.
  const loadMore = useCallback(() => {
    setResumeBaseline(loadedCount);
    requestMore();
  }, [loadedCount, requestMore]);

  // Infinite scroll, without the classic double-load. A naive "load a page when
  // the bottom sentinel is visible" over-fetches: when a page's rows commit,
  // this component re-renders (loadedCount changed) *before* the
  // IntersectionObserver has re-evaluated the sentinel's new position, so a
  // stale "still visible" fires a second load. `useBottomSentinel` re-observes
  // the sentinel whenever the pass-through deps change, so every trigger
  // reflects the *current* post-layout visibility — it loads one page, and only
  // loads another if the sentinel is genuinely still on screen.
  const sentinelRef = useBottomSentinel(canLoadMore ? requestMore : null, [
    loadedCount,
    canLoadMore,
  ]);

  const cards: ReactNode[] = [];
  data.forEach((row, i) => {
    if (row == null) return;
    const selected = selectedIndices.has(i);
    cards.push(
      h(
        "div.data-panel-item",
        { key: `row-${i}`, className: selected ? "selected" : undefined },
        h(ItemComponent, {
          data: row,
          index: i,
          selected,
          onSelect: (arg?: SelectModifiers | ReactMouseEvent) =>
            select(i, modifiersOf(arg)),
        }),
      ),
    );
  });

  const counter =
    footer.total != null
      ? `${footer.loaded} of ${footer.total}`
      : `${footer.loaded} loaded`;

  const footerContent =
    typeof footerSlot === "function"
      ? footerSlot({
          loadMore,
          loading: footer.loading,
          hasMore,
          loaded: footer.loaded,
          total: footer.total,
          paused,
        })
      : footerSlot;

  // An inline footer is the end-of-scroll region itself, so it always renders
  // (deciding its own content: spinner mid-burst, "Load more" at a pause, or an
  // end-of-list note). It carries the sentinel ref; auto-load is gated by
  // `canLoadMore`, so a paused/exhausted footer just sits there.
  const showInlineFooter = footerPlacement === "inline" && footerContent != null;
  // The default spinner sentinel (below-placement): hidden while paused so the
  // pinned footer's "Load more" takes over.
  const showSentinel =
    !showInlineFooter && (hasMore || footer.loading) && !paused;

  // Mount the loader only once the provider resolves (see `PanelLoader`). Built
  // as a real conditional — `h.if(...)` evaluates its arguments eagerly, so
  // `activeProvider.fetchData` can't be referenced inside it while null.
  let loaderNode: ReactNode = null;
  if (activeProvider != null) {
    loaderNode = h(PanelLoader, {
      key: "loader",
      fetchData: activeProvider.fetchData,
      pageSize: loaderPageSize,
      fetchMode: isLocalProvider ? undefined : "scroll",
    });
  }

  // Header controls: the selection ActionsToolbar always renders; below it,
  // either the caller's custom `toolbar` or the default FacetControls +
  // FilterBar. A custom toolbar owns its own filter display, so the default
  // FilterBar steps aside (the caller can re-include either via the exports).
  const controls =
    toolbar !== undefined
      ? toolbar
      : [
          h(FacetControls, { key: "facets" }),
          h(FilterBar, { key: "filter-bar", filters: filters ?? [] }),
        ];

  const ScrollBody = scrollBody ?? DefaultScrollBody;

  // The panel owns the scroll container + the loading sentinel; the (custom or
  // default) scroll body only lays out the cards. So a grid / grouped / windowed
  // body composes without reimplementing paging or selection. The end-of-scroll
  // region is either the default spinner sentinel or the caller's inline
  // footer — both carry the sentinel ref that drives auto-load.
  // The top fade is gated on being scrolled (via `.is-scrolled`), so the first
  // item isn't clipped at rest.
  const bodyTag =
    "div.data-panel-body" +
    (topFade ? ".top-fade" : "") +
    (scrolled ? ".is-scrolled" : "");
  const body = h(bodyTag, { key: "body", onScroll: onBodyScroll }, [
    h(ScrollBody, { key: "scroll-body" }, cards),
    showInlineFooter
      ? h("div.data-panel-tail", { key: "tail", ref: sentinelRef }, footerContent)
      : h.if(showSentinel)(
          "div.sentinel",
          { key: "sentinel", ref: sentinelRef },
          [h(Spinner, { key: "spinner", size: 16 }), "Loading…"],
        ),
  ]);

  // Body + optional filter/detail sidebar share a horizontal row so each
  // scrolls independently.
  const main =
    sidebar != null
      ? h("div.data-panel-main", { key: "main" }, [
          h("div.data-panel-sidebar", { key: "sidebar" }, sidebar),
          body,
        ])
      : body;

  // Pinned footer below the scroll (unless the footer is placed inline).
  const pinnedFooter =
    !showInlineFooter && footerContent != null
      ? h("div.data-panel-footer-slot", { key: "footer-slot" }, footerContent)
      : null;

  // Bottom status row (counter + extras). `statusBar === false` drops it — e.g.
  // when an inline footer carries the counter itself.
  const statusRow =
    statusBar === false
      ? null
      : h("div.data-panel-footer", { key: "footer" }, [
          h("span.counter", { key: "counter" }, counter),
          h("div.spacer", { key: "spacer" }),
          statusBar,
        ]);

  return h("div.data-panel", { className }, [
    loaderNode,
    h(ActionsToolbar, { key: "toolbar", actions: actions ?? [], tableName: name }),
    controls,
    main,
    pinnedFooter,
    statusRow,
  ]);
}

/**
 * Stand-in for the column-header dropdown the card list lacks: "Filter" and
 * "Sort" menus listing the column-declared `filterable` / `sortable` fields.
 * Each field reuses the *exact* data-sheet controls — `ColumnSortMenu`
 * (Ascending/Descending submenu) and `ColumnFilterMenuItem` (the operator form
 * in a submenu) — so sort/filter behave identically to the sheet and flow
 * through the same store + provider seam (the server applies them).
 */
export function FacetControls() {
  const columnSpec = useSelector((s) => s.columnSpec);

  const filterableCols = useMemo(
    () => columnSpec.filter((c) => isColumnFilterable(c)),
    [columnSpec],
  );
  const sortableCols = useMemo(
    () => columnSpec.filter((c) => c.sortable),
    [columnSpec],
  );

  if (filterableCols.length === 0 && sortableCols.length === 0) return null;

  const filterMenu = h(
    Menu,
    filterableCols.map((col) =>
      h(ColumnFilterMenuItem, {
        key: col.key,
        filter: resolveColumnFilter(col),
        label: col.name,
      }),
    ),
  );

  const sortMenu = h(
    Menu,
    sortableCols.map((col) =>
      h(ColumnSortMenu, { key: col.key, columnKey: col.key, text: col.name }),
    ),
  );

  return h("div.facet-controls", [
    h.if(filterableCols.length > 0)(
      PopoverNext,
      { key: "filter", content: filterMenu, placement: "bottom-start" },
      h(Button, { minimal: true, small: true, icon: "filter" }, "Filter"),
    ),
    h.if(sortableCols.length > 0)(
      PopoverNext,
      { key: "sort", content: sortMenu, placement: "bottom-start" },
      h(Button, { minimal: true, small: true, icon: "sort" }, "Sort"),
    ),
  ]);
}

/** Default scroll-body layout: a vertical flex list of cards. */
function DefaultScrollBody({ children }: ScrollBodyProps) {
  return h("div.data-panel-list", children);
}

/** Runs the shared windowed loader from inside the panel (renders nothing).
 * Mounted only once the real provider is resolved, so `useDataLoader` captures
 * the real `fetchData` from the start (see `_DataPanel`). */
function PanelLoader<T = any>({
  fetchData,
  ...options
}: { fetchData: FetchData<T> } & FetchDataOptions) {
  useDataLoader(fetchData, options);
  return null;
}

/** Resolve the selection modifiers from either a click event (reads shift /
 * cmd / ctrl) or an explicit modifier object; no argument ⇒ a plain select. */
function modifiersOf(arg?: SelectModifiers | ReactMouseEvent): SelectModifiers {
  if (arg == null) return {};
  if ("shiftKey" in arg) {
    return { additive: arg.metaKey || arg.ctrlKey, range: arg.shiftKey };
  }
  return arg;
}

/** Collapse a set of selected row indices into `FULL_ROWS` regions, merging
 * contiguous runs into a single `{ rows: [start, end] }` range. */
function indicesToRegions(indices: Set<number>): Region[] {
  const sorted = Array.from(indices).sort((a, b) => a - b);
  const regions: Region[] = [];
  let start: number | null = null;
  let prev: number | null = null;
  for (const i of sorted) {
    if (start == null) {
      start = prev = i;
    } else if (i === prev! + 1) {
      prev = i;
    } else {
      regions.push({ rows: [start, prev!] });
      start = prev = i;
    }
  }
  if (start != null) regions.push({ rows: [start, prev!] });
  return regions;
}

/**
 * Bottom-sentinel infinite-scroll hook (no `react-intersection-observer`
 * dependency). Calls `onVisible` when the observed element is on screen, and —
 * crucially — **re-observes on every `deps` change** so the callback reflects
 * the *current* post-layout visibility rather than the pre-load render.
 *
 * This is what avoids the double-load: a plain observer whose visibility is
 * mirrored into React state lags a render behind the DOM, so a load-driven
 * re-render fires a second `onVisible` before the observer catches up. By
 * re-arming after each load (`deps = [loadedCount, canLoadMore]`), the observer
 * emits a fresh callback for the settled layout: it fires again only if the
 * sentinel is *still* visible (viewport not yet filled), so it loads exactly
 * one page per bottom-reach and self-fills an underfull viewport without
 * overshooting. Pass `onVisible = null` to disarm (loading / no more data).
 */
function useBottomSentinel<E extends HTMLElement>(
  onVisible: (() => void) | null,
  deps: unknown[],
): (el: E | null) => void {
  const elRef = useRef<E | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cbRef = useRef(onVisible);
  cbRef.current = onVisible;

  const setRef = useCallback((el: E | null) => {
    elRef.current = el;
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (el == null) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) cbRef.current?.();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  // Re-arm after each load so the observer re-checks the settled layout.
  useEffect(() => {
    const el = elRef.current;
    const observer = observerRef.current;
    if (el == null || observer == null) return;
    observer.disconnect();
    observer.observe(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => () => observerRef.current?.disconnect(), []);
  return setRef;
}
