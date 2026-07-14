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
  MouseEvent as ReactMouseEvent,
  ReactNode,
  UIEvent as ReactUIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, Menu, PopoverNext, Spinner } from "@blueprintjs/core";
import {
  ctx,
  dataProviderAtom,
  DataSheetProvider,
  FetchData,
  useResolvedProvider,
  useSelector,
  useStoreAPI,
} from "./provider";
import { ToasterContext } from "@macrostrat/ui-components";
import {
  ActionsToolbar,
  buildDataViewSelection,
  ColumnFilterMenuItem,
  ColumnSortMenu,
  FilterBar,
  getSelectedRowIndices,
  isColumnFilterable,
  resolveColumnFilter,
  rowIndicesToRegions,
} from "./actions";
import {
  autoLoadPagesAtom,
  useDataLoader,
  useLoadControls,
} from "./postgrest-table";
import classNames from "classnames";
import { LoadProgressIndicator } from "./components";
import { DataPanelProps, FetchDataOptions, SelectModifiers } from "./types";

/**
 * Resolve the data source (shared with `DataSheet` / `DataView` via
 * `useResolvedProvider`), wrap in the shared provider, and render the inner
 * panel.
 */
export function DataPanel<T>(props: DataPanelProps<T>) {
  const {
    data,
    columnSpec,
    columnSpecOptions,
    refreshToken,
    identity,
    itemLabel,
    editable = true,
    ...rest
  } = props;
  const { data: _data, dataProvider } = useResolvedProvider<T>(props);

  return h(
    DataSheetProvider<T>,
    {
      data: _data,
      columnSpec,
      columnSpecOptions,
      editable,
      dataProvider,
      refreshToken,
      identity,
      itemLabel,
    },
    h(DataPanelRenderer<any>, rest),
  );
}

/** The card-list renderer. Assumes it is rendered inside a `DataSheetProvider`
 * (the `DataPanel` wrapper, or `DataView`). Exported so a shared-store
 * `DataView` can mount it directly alongside `_DataSheet`. */
export function DataPanelRenderer<T>({
  itemComponent,
  actions = [],
  filters = [],
  pageSize = 50,
  name,
  // Bottom bar
  statusBar,
  toolbar,
  sidebar,
  // Footer within content flow
  contentFooter,
  autoLoadPages,
  scrollBody,
  topFade = true,
  className,
  enableSelection = true,
  enableMultipleSelection = true,
}: Omit<DataPanelProps<T>, "provider" | "fetchData" | "data" | "identity">) {
  const {
    provider: activeProvider,
    isLocalProvider,
    localCount,
  } = ctx.useValue(dataProviderAtom);

  // The loader is mounted as a child component (below), NOT called as a hook
  // here, and only once `activeProvider` resolves. This mirrors `_DataSheet`:
  // `dataProviderAtom` is synced by a parent effect that fires *after* this
  // component's effects, so a hook call here would capture the placeholder
  // provider on first render and — since `fetchData` isn't one of its effect
  // deps — never re-fetch with the real one. A child that mounts with the real
  // `fetchData` already in hand sidesteps that entirely.
  // A local (in-memory) source loads all of its rows in one page; its count
  // rides on the resolved provider, so the renderer no longer takes a `data`
  // prop (the store is the single source of live rows).
  const loaderPageSize = isLocalProvider ? Math.max(localCount, 1) : pageSize;

  const data = useSelector((s) => s.data);
  const selection = useSelector((s) => s.selection);
  const storeAPI = useStoreAPI();

  // Load state + pause/resume live in the store, read via `useLoadControls`
  // (also available to the caller's `footer` via the same hook). The panel's
  // `autoLoadPages` prop is the store's configuration input.
  ctx.useSync(autoLoadPagesAtom, autoLoadPages ?? null);
  const { loading, hasMore, loaded, total, paused, canLoadMore, advance } =
    useLoadControls();

  // Track whether the body is scrolled off the top, to gate the top fade.
  // `setState` with an unchanged value is a no-op, so this only re-renders on
  // the at-top ↔ scrolled transition.
  const [scrolled, setScrolled] = useState(false);
  const onScroll = useCallback((e: ReactUIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 4);
  }, []);

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
      selection: rowIndicesToRegions(new Set(getSelectedRowIndices(selection))),
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
      if (!enableSelection) return;
      const selection = storeAPI.getState().selection;
      storeAPI.setState({
        selection: buildDataViewSelection(
          index,
          anchorRef,
          selection,
          mods,
          enableMultipleSelection ?? true,
        ),
        focusedCell: null,
        topLeftCell: null,
      });
    },
    [storeAPI, enableSelection, enableMultipleSelection],
  );

  const loadedCount = useMemo(() => {
    let n = 0;
    for (const r of data) if (r != null) n++;
    return n;
  }, [data]);

  // Refresh-token, rowEditing, and load controls (loadMore / pause) are all
  // store-managed (see `useLoadControls`), shared with `_DataSheet` — so both
  // renderers, and any footer, drive loading off one source.

  // Infinite scroll. A naive "load a page when the bottom sentinel is visible"
  // over-fetches: when a page's rows commit, this component re-renders
  // (loadedCount changed) *before* the IntersectionObserver has re-evaluated
  // the sentinel's new position, so a stale "still visible" fires a second
  // load. `useBottomSentinel` re-observes the sentinel whenever the pass-through
  // deps change, so every trigger reflects the *current* post-layout
  // visibility — it loads one page, and only loads another if the sentinel is
  // genuinely still on screen. `advance` (from the store) moves the loader one
  // page without resuming a paused auto-load.
  const sentinelRef = useBottomSentinel(canLoadMore ? advance : null, [
    loadedCount,
    canLoadMore,
  ]);

  const cards: ReactNode[] = [];
  data.forEach((row, i) => {
    if (row == null) return;
    const selected = enableSelection && selectedIndices.has(i);
    cards.push(
      h(
        "div.data-panel-item",
        { key: `row-${i}`, className: classNames({ selected }) },
        h(itemComponent, {
          data: row,
          index: i,
          selected,
          onSelect: (arg?: SelectModifiers | ReactMouseEvent) =>
            select(i, modifiersOf(arg)),
        }),
      ),
    );
  });

  // An inline footer is the end-of-scroll region itself, so it always renders
  // (deciding its own content: spinner mid-burst, "Load more" at a pause, or an
  // end-of-list note). It carries the sentinel ref; auto-load is gated by
  // `canLoadMore`, so a paused/exhausted footer just sits there.
  const showInlineFooter = contentFooter != null;
  // The default spinner sentinel (below-placement): hidden while paused so the
  // pinned footer's "Load more" takes over.
  const shouldLoadNextPage = (hasMore || loading) && !paused;

  const showSentinel = !showInlineFooter && shouldLoadNextPage;

  // Mount the loader only once the provider resolves (see `PanelLoader`). Built
  // as a real conditional — `h.if(...)` evaluates its arguments eagerly, so
  // `activeProvider.fetchData` can't be referenced inside it while null.
  let loaderNode: ReactNode = null;
  if (activeProvider != null) {
    loaderNode = h(PanelLoader, {
      fetchData: activeProvider.fetchData,
      pageSize: loaderPageSize,
      fetchMode: isLocalProvider ? undefined : "scroll",
    });
  }

  // Header controls: the selection ActionsToolbar always renders; below it,
  // either the caller's custom `toolbar` or the default FacetControls +
  // FilterBar. A custom toolbar owns its own filter display, so the default
  // FilterBar steps aside (the caller can re-include either via the exports).
  let controls: ReactNode;
  if (toolbar !== undefined) {
    controls = toolbar;
  } else {
    controls = [h(FacetControls), h(FilterBar, { filters })];
  }

  const ScrollBody = scrollBody ?? DefaultScrollBody;

  // The panel owns the scroll container + the loading sentinel; the (custom or
  // default) scroll body only lays out the cards. So a grid / grouped / windowed
  // body composes without reimplementing paging or selection. The end-of-scroll
  // region is either the default spinner sentinel or the caller's inline
  // footer — both carry the sentinel ref that drives auto-load.
  // The top fade is gated on being scrolled (via `.is-scrolled`), so the first
  // item isn't clipped at rest.

  let _contentFooter: ReactNode = null;
  if (showInlineFooter) {
    _contentFooter = h(
      "div.content-footer-holder",
      { ref: sentinelRef },
      contentFooter,
    );
  } else if (showSentinel) {
    _contentFooter = h("div.sentinel", { ref: sentinelRef }, [
      h(Spinner, { size: 16 }),
      "Loading…",
    ]);
  }

  // Body + optional filter/detail sidebar share a horizontal row so each
  // scrolls independently.

  // Bottom status row (counter + extras). `statusBar === false` drops it — e.g.
  // when an inline footer carries the counter itself.
  let footer: ReactNode = null;
  let _statusBarContent = statusBar ?? h(DataPanelStatusBar);
  if (_statusBarContent !== false) {
    footer = h("div.data-panel-footer", [_statusBarContent]);
  }

  return h("div.data-panel", { className }, [
    loaderNode,
    h(ActionsToolbar, {
      actions,
      tableName: name,
    }),
    h("div.control-bar", controls),
    h("div.data-panel-main", [
      h(
        "div.data-panel-body",
        {
          onScroll,
          className: classNames(
            { "top-fade": topFade, "is-scrolled": scrolled },
            className,
          ),
        },
        [h(ScrollBody, cards), _contentFooter],
      ),
      h.if(sidebar != null)("div.data-panel-sidebar-container", sidebar),
    ]),
    footer,
  ]);
}

function DataPanelStatusBar({ children }) {
  /** Default status bar for the Data Panel */
  return h("div.data-panel-status-bar", [children, h(LoadProgressIndicator)]);
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
function DefaultScrollBody({ children }: { children: ReactNode }) {
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
