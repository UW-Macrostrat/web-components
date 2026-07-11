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
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Region } from "@blueprintjs/table";
import { Button, Menu, MenuItem, PopoverNext, Spinner } from "@blueprintjs/core";
import {
  ctx,
  DataSheetProvider,
  dataProviderAtom,
  useSelector,
  useStoreAPI,
} from "../provider";
import { ErrorBoundary, ToasterContext } from "@macrostrat/ui-components";
import type { ColumnSpec } from "../utils";
import {
  ActionsToolbar,
  columnFilter,
  columnFilterId,
  FilterBar,
  getSelectedRowIndices,
  TableAction,
  TableFilter,
} from "../actions";
import {
  createLocalProvider,
  FetchData,
  FetchDataOptions,
  tableFooterAtom,
  TableDataProvider,
  useDataLoader,
  useScrollHandler,
} from "../postgrest-table";

/** Props handed to a consumer's card renderer for one row. */
export interface DataPanelItemProps<T = any> {
  /** The row's data. */
  data: T;
  /** Underlying data-row index (stable within a loaded window). */
  index: number;
  /** Whether this row is in the current selection. */
  selected: boolean;
  /** Toggle this row's selection. Pass `{ additive: true }` (cmd/ctrl-click) to
   * add to the selection instead of replacing it. */
  toggleSelected: (opts?: { additive?: boolean }) => void;
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
  /** Arbitrary nodes for the footer (beside the loaded/total counter). */
  statusBar?: ReactNode;
  className?: string;
}

const emptyData: any[] = [];

/**
 * Resolve the data source once (mirrors `DataSheet`), wrap in the shared
 * provider, and render the inner panel. An explicit `provider` wins; else a
 * loose `fetchData` (+ identity); else in-memory `data` becomes a local
 * provider.
 */
export function DataPanel<T>(props: DataPanelProps<T>) {
  const { data, columnSpec, columnSpecOptions, ...rest } = props;
  const _data = data ?? emptyData;

  const isLocalProvider = props.provider == null && props.fetchData == null;
  const activeProvider = useMemo<TableDataProvider<any> | null>(() => {
    if (props.provider != null) return props.provider;
    if (props.fetchData != null) {
      return {
        fetchData: props.fetchData,
        identity: props.identity ?? ((r: any) => r?.id),
      };
    }
    if (_data.length > 0) {
      return createLocalProvider(
        _data,
        props.identity != null ? { identity: props.identity } : undefined,
      );
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.provider, props.fetchData, _data, props.identity]);

  const dataProvider = useMemo(
    () => ({ provider: activeProvider, isLocalProvider }),
    [activeProvider, isLocalProvider],
  );

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

function _DataPanel<T>({
  data: sourceData,
  itemComponent: ItemComponent,
  actions,
  filters,
  pageSize = 50,
  name,
  statusBar,
  className,
}: Omit<DataPanelProps<T>, "provider" | "fetchData" | "identity"> & {
  data?: T[];
}) {
  const { provider: activeProvider, isLocalProvider } =
    ctx.useValue(dataProviderAtom);

  // Drive the shared loader from the resolved provider. A local (in-memory)
  // provider loads everything in one chunk; a remote one pages by `pageSize`.
  const fetchData: FetchData<T> = activeProvider?.fetchData ?? emptyFetch;
  const loaderOptions: FetchDataOptions = {
    pageSize: isLocalProvider
      ? Math.max(sourceData?.length ?? 1, 1)
      : pageSize,
    fetchMode: "scroll",
  };
  useDataLoader(fetchData, loaderOptions);

  const data = useSelector((s) => s.data);
  const selection = useSelector((s) => s.selection);
  const storeAPI = useStoreAPI();
  const footer = ctx.useValue(tableFooterAtom);

  const selectedIndices = useMemo(
    () => new Set(getSelectedRowIndices(selection)),
    [selection],
  );

  // Selection is expressed as `FULL_ROWS` regions so the existing row-targeted
  // action machinery (toolbar title, `getSelectedRowIndices`, delete/tag
  // actions) applies unchanged — one region per selected row.
  const toggleSelected = useCallback(
    (index: number, additive: boolean) => {
      const next = new Set(selectedIndices);
      if (next.has(index)) {
        next.delete(index);
      } else {
        if (!additive) next.clear();
        next.add(index);
      }
      const regions: Region[] = Array.from(next)
        .sort((a, b) => a - b)
        .map((i) => ({ rows: [i, i] as [number, number] }));
      storeAPI.setState({
        selection: regions,
        focusedCell: null,
        topLeftCell: null,
      });
    },
    [selectedIndices, storeAPI],
  );

  // Infinite scroll: a bottom sentinel advances the loader's visible region.
  // The loader fetches the chunk covering the first unloaded row in the region
  // and auto-cascades while the sentinel stays in view, so short pages fill the
  // viewport and scrolling loads the next window.
  const onScroll = useScrollHandler();
  const loadedCount = useMemo(() => {
    let n = 0;
    for (const r of data) if (r != null) n++;
    return n;
  }, [data]);
  const [sentinelRef, inView] = useIntersecting<HTMLDivElement>();
  useEffect(() => {
    if (!inView) return;
    onScroll({ rowIndexStart: 0, rowIndexEnd: loadedCount + pageSize });
  }, [inView, loadedCount, pageSize, onScroll]);

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
          toggleSelected: (opts?: { additive?: boolean }) =>
            toggleSelected(i, opts?.additive ?? false),
        }),
      ),
    );
  });

  const hasMore =
    !isLocalProvider &&
    (footer.total == null || footer.loaded < (footer.total ?? 0));
  const showSentinel = hasMore || footer.loading;

  const counter =
    footer.total != null
      ? `${footer.loaded} of ${footer.total}`
      : `${footer.loaded} loaded`;

  return h("div.data-panel", { className }, [
    h(ActionsToolbar, { key: "toolbar", actions: actions ?? [], tableName: name }),
    h(FacetControls, { key: "facets" }),
    h(FilterBar, { key: "filter-bar", filters: filters ?? [] }),
    h("div.data-panel-body", { key: "body" }, [
      ...cards,
      h.if(showSentinel)(
        "div.sentinel",
        { key: "sentinel", ref: sentinelRef },
        [h(Spinner, { key: "spinner", size: 16 }), "Loading…"],
      ),
    ]),
    h("div.data-panel-footer", { key: "footer" }, [
      h("span.counter", { key: "counter" }, counter),
      h("div.spacer", { key: "spacer" }),
      statusBar,
    ]),
  ]);
}

/**
 * Stand-in for the column-header dropdown the card list lacks: menus to add a
 * column filter / sort, sourced from the column-declared `filterable` /
 * `sortable` capabilities. Adding a filter seeds the store with the column's
 * built-in operator `columnFilter`; the active tag (in `FilterBar`) then
 * reconfigures it. Both flow through the same store + provider seam as the
 * sheet, so the server applies them.
 */
function FacetControls() {
  const columnSpec = useSelector((s) => s.columnSpec);
  const columnSorts = useSelector((s) => s.columnSorts);
  const activeFilters = useSelector((s) => s.activeFilters);
  const storeAPI = useStoreAPI();

  const filterableCols = useMemo(
    () => columnSpec.filter((c) => c.filterable),
    [columnSpec],
  );
  const sortableCols = useMemo(
    () => columnSpec.filter((c) => c.sortable),
    [columnSpec],
  );

  if (filterableCols.length === 0 && sortableCols.length === 0) return null;

  const filterMenu = h(
    Menu,
    filterableCols.map((col) => {
      const id = columnFilterId(col.key);
      const active = activeFilters.has(id);
      return h(MenuItem, {
        key: col.key,
        text: col.name,
        icon: active ? "tick" : "filter",
        disabled: active,
        onClick() {
          const f = columnFilter(col);
          storeAPI.getState().setFilter(id, f, f.defaultState);
        },
      });
    }),
  );

  const sortMenu = h(
    Menu,
    sortableCols.map((col) => {
      const active = columnSorts.find((s) => s.key === col.key);
      const icon =
        active == null ? "sort" : active.ascending ? "sort-asc" : "sort-desc";
      // Cycle asc → desc → off on repeated selection.
      const next =
        active == null ? true : active.ascending ? false : null;
      return h(MenuItem, {
        key: col.key,
        text: col.name,
        icon,
        onClick() {
          storeAPI.getState().setColumnSort(col.key, next);
        },
      });
    }),
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

/** No-op fetch used while no provider is resolved (keeps hook order stable). */
const emptyFetch: FetchData<any> = async () => ({ rows: [], totalCount: 0 });

/** Minimal IntersectionObserver hook (avoids a `react-intersection-observer`
 * dependency): returns a ref to attach and whether the element is on screen. */
function useIntersecting<E extends HTMLElement>(): [
  (el: E | null) => void,
  boolean,
] {
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const setRef = useCallback((el: E | null) => {
    observerRef.current?.disconnect();
    if (el == null) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px" },
    );
    observer.observe(el);
    observerRef.current = observer;
  }, []);
  useEffect(() => () => observerRef.current?.disconnect(), []);
  return [setRef, inView];
}
const __probe: number = "x";
