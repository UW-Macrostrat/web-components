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
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  UIEvent as ReactUIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Icon, Spinner } from "@blueprintjs/core";
import {
  anchorRefAtom,
  ctx,
  dataProviderAtom,
  DataSheetProvider,
  DataViewRendererType,
  FetchData,
  interactionOptionsAtom,
  selectionAtom,
  splitDataProviderProps,
  useSelector,
} from "./provider";
import {
  buildDataViewSelection,
  getSelectedRowIndices,
  rowIndicesToRegions,
  TableAction,
} from "./actions";
import {
  autoLoadPagesAtom,
  useDataLoader,
  useLoadControls,
} from "./postgrest-table";
import classNames from "classnames";
import {
  ActionsToolbar,
  LoadProgressIndicator,
  useDataPanelControls,
} from "./components";
import { DataViewSharedProps, FetchDataOptions } from "./types";
import { atom } from "jotai";
import { passThroughSet } from "./utils";

export enum DataPanelToolbarStyle {
  BORDERED = "bordered",
  FADE = "fade",
  MINIMAL = "minimal",
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
export interface ItemComponentProps<T = any> {
  /** The row's data. */
  data: T;
  /** Underlying data-row index (stable within a loaded window). */
  index: number;
  /** Whether this row is in the current selection. */
  selected: boolean;
  /** Whether the row can be selected */
  selectable: boolean;
  /** Select this row. Pass the click's `MouseEvent` (or `React.MouseEvent`) to
   * honor shift / cmd / ctrl automatically — the usual wiring is
   * `onClick: onSelect`. Or pass an explicit `SelectModifiers` object; no
   * argument means a plain (replace) select. */
  onSelect: (arg?: SelectModifiers | ReactMouseEvent) => void;
}

export interface DataPanelProps<T = any> extends DataViewSharedProps<T> {
  /** Renders one row as a card. */
  itemComponent: ComponentType<ItemComponentProps<T>>;
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
  /** Custom layout for the item cards — the seam for anything other than a
   * vertical list (a CSS grid for several per row, grouped sections, sticky
   * sub-headers, a windowed renderer). Receives the rendered cards as
   * `children`; the panel still owns the scroll container and the loading
   * sentinel, so paging and selection keep working. Defaults to a vertical
   * flex list. */
  scrollBody?: ComponentType<ScrollBodyProps>;
  className?: string;
  toolbarStyle?: DataPanelToolbarStyle | string;
  /** Arbitrary children rendered inside the provider, after the panel. */
  children?: ReactNode;
}

/**
 * Resolve the data source (shared with `DataSheet` / `DataView` via
 * `useResolvedProvider`), wrap in the shared provider, and render the inner
 * panel.
 */
export function DataPanel<T>(props: DataPanelProps<T>) {
  const [providerProps, rendererProps] = splitDataProviderProps({
    ...props,
    viewType: DataViewRendererType.CARDS,
  });
  return h(
    DataSheetProvider<T>,
    providerProps,
    h(DataPanelRenderer<any>, rendererProps),
  );
}

/** Selection modifier keys, following the familiar list idiom. */
export interface SelectModifiers {
  /** cmd/ctrl — toggle this row in/out of the selection (or extend a range). */
  additive?: boolean;
  /** shift — select the range from the anchor (last plain/cmd click) to here. */
  range?: boolean;
}

/** The card-list renderer. Assumes it is rendered inside a `DataSheetProvider`
 * (the `DataPanel` wrapper, or `DataView`). Exported so a shared-store
 * `DataView` can mount it directly alongside `_DataSheet`. */
export function DataPanelRenderer<T>({
  itemComponent,
  actions = [],
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
  className,
  toolbarStyle = DataPanelToolbarStyle.BORDERED,
  children,
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

  const enableSelection = ctx.useValue(interactionOptionsAtom).enableSelection;
  const selectedIndices = ctx.useValue(selectedRowIndicesAtom);
  const select = ctx.useSet(updateSelectionAtom);

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
          selectable: enableSelection,
          onSelect: (arg?: SelectModifiers | ReactMouseEvent) =>
            select(i, modifiersOf(arg)),
        }),
      ),
    );
  });

  // The default spinner sentinel (below-placement): hidden while paused so the
  // pinned footer's "Load more" takes over.
  const shouldLoadNextPage = (hasMore || loading) && !paused;

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

  const coreActions = useDataPanelControls();

  // Merge consumer actions with the synthesized Filter/Sort controls, deduped
  // by id — consumer actions come first, so passing an action with id `filter`
  // or `sort` *replaces* the built-in one (a hybrid set keeps the others).
  // Mirrors the sheet's action registry contract (see `data-sheet.ts`).
  const _actions = useMemo(() => {
    const merged: TableAction[] = [];
    const add = (list: TableAction[]) => {
      for (const a of list) {
        if (!merged.some((x) => x.id === a.id)) merged.push(a);
      }
    };
    add(actions);
    add(coreActions);
    return merged;
  }, [actions, coreActions]);

  const ScrollBody = scrollBody ?? DefaultScrollBody;

  // The panel owns the scroll container + the loading sentinel; the (custom or
  // default) scroll body only lays out the cards. So a grid / grouped / windowed
  // body composes without reimplementing paging or selection. The end-of-scroll
  // region is either the default spinner sentinel or the caller's inline
  // footer — both carry the sentinel ref that drives auto-load.
  // The top fade is gated on being scrolled (via `.is-scrolled`), so the first
  // item isn't clipped at rest.

  const showStatusBar = statusBar !== false;

  let defaultFooter: ReactNode = null;
  if (shouldLoadNextPage) {
    defaultFooter = h("div.sentinel", [h(Spinner, { size: 16 }), "Loading..."]);
  } else if (!showStatusBar) {
    defaultFooter = h("div.sentinel", [
      h(Icon, { size: 16, icon: "tick" }),
      "Loaded",
    ]);
  }

  const _contentFooter = h(
    "div.content-footer-holder",
    { ref: sentinelRef },
    contentFooter ?? defaultFooter,
  );

  // Body + optional filter/detail sidebar share a horizontal row so each
  // scrolls independently.

  // Bottom status row (counter + extras). `statusBar === false` drops it — e.g.
  // when an inline footer carries the counter itself.
  let footer: ReactNode = null;
  let _statusBarContent = statusBar ?? h(DataPanelStatusBar);
  if (showStatusBar) {
    footer = h(
      "div.data-panel-footer",
      h("div.data-panel-footer-content", [_statusBarContent]),
    );
  }

  return h(
    "div.data-panel",
    { className: classNames(className, "toolbar-style-" + toolbarStyle) },
    [
      h("div.data-panel-main", [
        loaderNode,
        h(
          "div.data-panel-toolbar",
          h(
            ActionsToolbar,
            {
              actions: _actions,
              tableName: name,
              className: "data-panel-toolbar-content",
            },
            toolbar,
          ),
        ),
        h(
          "div.data-panel-body",
          {
            onScroll,
            className: classNames({ "is-scrolled": scrolled }),
          },
          h("div.data-panel-body-content", [
            h(ScrollBody, cards),
            _contentFooter,
          ]),
        ),
        footer,
      ]),
      h.if(sidebar != null)("div.data-panel-sidebar-container", sidebar),
      children,
    ],
  );
}

function DataPanelStatusBar({ children }) {
  /** Default status bar for the Data Panel */
  return h("div.data-panel-status-bar", [children, h(LoadProgressIndicator)]);
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

const rowSelectionAtom = atom((get) => {
  /** Coerce selection to full rows, for use with data panel instead of data sheet. */
  const selection = get(selectionAtom);
  if (selection.some((r) => r.cols != null)) {
    // A card list has no cells or columns. When the selection carries columns —
    // inherited from a shared store the sheet also drives (a `DataView` toggle) —
    // coerce it to the full rows it covers, so the toolbar shows row-scoped
    // actions rather than column/cell ones for a column that isn't visible here.
    // Column-only selections (no rows) collapse to nothing.
    return rowIndicesToRegions(new Set(getSelectedRowIndices(selection)));
  } else {
    return selection;
  }
}, passThroughSet(selectionAtom));

const updateSelectionAtom = atom(
  null,
  (get, set, index: number, mods: SelectModifiers) => {
    /** Update selection from a row index and modifiers. */
    const { enableMultipleSelection, enableSelection } = get(
      interactionOptionsAtom,
    );
    if (!enableSelection) return;
    const selection = get(rowSelectionAtom);
    const anchorRef = get(anchorRefAtom);
    const res = buildDataViewSelection(
      index,
      mods,
      selection,
      anchorRef,
      enableMultipleSelection,
    );
    set(selectionAtom, res);
  },
);

const selectedRowIndicesAtom = atom((get) => {
  const sel = get(selectionAtom);
  return new Set(getSelectedRowIndices(sel));
});

type ItemSelectionKeys = "onSelect" | "selected" | "selectable";

type DataCardProps = {
  children: ReactNode;
  className: string;
  style?: CSSProperties;
} & Pick<ItemComponentProps, ItemSelectionKeys>;

export function DataCard<T = any>(props: DataCardProps) {
  /** A basic card that implements the data panel's selection behavior. */
  return h(
    "div.data-card.data-panel-item",
    {
      className: classNames(props.className, {
        selected: props.selected,
        selectable: props.selectable,
      }),
      onClick: props.onSelect,
      style: props.style,
    },
    props.children,
  );
}

type DataCardInnerComponent<T> = (
  props: ItemComponentProps<T>,
) => React.ReactNode;

export function createDataCard<T>(
  component: DataCardInnerComponent<T>,
  extraProps = {},
) {
  return (props: ItemComponentProps<T>) => {
    const { selected, selectable, onSelect } = props;
    return h(
      DataCard,
      {
        selected,
        selectable,
        onSelect,
        ...extraProps,
      },
      h(component, props),
    );
  };
}
