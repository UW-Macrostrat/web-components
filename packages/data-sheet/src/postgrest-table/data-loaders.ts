/** Lazy loading of data from a PostgREST endpoint */

import { useAsyncEffect } from "@macrostrat/ui-components";
import { debounce, range } from "underscore";
import { useCallback, useEffect, useMemo, useRef } from "react";
import update, { Spec } from "immutability-helper";
import {
  PostgrestClient,
  PostgrestFilterBuilder,
  PostgrestQueryBuilder,
} from "@supabase/postgrest-js";
import { adjustArraySize, RowRegion, sleep } from "./loading-utils.ts";
import { ctx, tableDataAtom, useSelector } from "../provider.ts";
import { atom } from "jotai";
import h from "./main.module.sass";
import type { ColumnSort } from "../types.ts";

export type FetchMode = "scroll" | "paged";

interface LazyLoaderStateCore<T> {
  loading: boolean;
  error: Error | null;
  initialized: boolean;
  /** Reported source length when known (null = unknown / not reported). */
  totalCount: number | null;
  /** Windowing style: infinite-scroll windows, or one fixed page at a time. */
  fetchMode: FetchMode;
  /** Rows per chunk/page. */
  pageSize: number;
}

interface LazyLoaderState<T> extends LazyLoaderStateCore<T> {
  data: (T | null)[];
  visibleRegion: RowRegion;
}

export interface PostgrestOrder<T> {
  key: string;
  ascending?: boolean;
  nullsFirst?: boolean;
}

/** Operators available for server-side column filtering via PostgREST. */
export type PostgrestFilterOperator =
  | "eq"
  | "neq"
  | "like"
  | "ilike"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "is";

/** A single column sort entry. */
export interface ColumnSortEntry {
  key: string;
  ascending: boolean;
}

/** A single column filter entry. */
export interface PostgrestColumnFilter {
  key: string;
  operator: PostgrestFilterOperator;
  value: string;
}

export interface PostgrestFilter {
  type: "filter";
  apply(
    req: PostgrestFilterBuilder<any, any, any, any>,
  ): PostgrestFilterBuilder<any, any, any, any>;
}

export function standardizeFilter(
  columnFilter: PostgrestColumnFilter,
): PostgrestFilter {
  return {
    type: "filter",
    apply(req) {
      return applyColumnFilters(req, [columnFilter]);
    },
  };
}

export function applyColumnFilters(
  req: PostgrestFilterBuilder<any, any, any, any>,
  filters: PostgrestColumnFilter[],
) {
  for (const cf of filters) {
    if (cf.value === "" || cf.value == null) continue;
    const val =
      cf.operator === "like" || cf.operator === "ilike"
        ? `*${cf.value}*`
        : cf.value;
    req = req.filter(cf.key, cf.operator, val);
  }
  return req;
}

type LazyLoaderAction<T> =
  | { type: "start-loading" }
  | {
      type: "loaded";
      data: T[];
      offset: number;
      totalSize: number;
      totalCount?: number | null;
    }
  | { type: "error"; error: Error }
  | { type: "update-data"; changes: Spec<T[]> }
  | { type: "reset" }
  | { type: "start-reload" }
  | { type: "configure"; fetchMode: FetchMode; pageSize: number };

function lazyLoadingReducer<T>(
  state: LazyLoaderState<T>,
  action: LazyLoaderAction<T>,
): LazyLoaderState<T> {
  switch (action.type) {
    case "start-loading":
      return {
        ...state,
        loading: true,
        initialized: true,
      };
    case "update-data":
      return {
        ...state,
        loading: false,
        data: update(state.data, action.changes),
      };
    case "loaded":
      let data = adjustArraySize(state.data, action.totalSize);
      const newData = action.data ?? [];
      const offset = action.offset ?? 0;
      data = [
        ...data.slice(0, offset),
        ...newData,
        ...data.slice(offset + newData.length),
      ];
      return {
        ...state,
        data,
        loading: false,
        totalCount:
          action.totalCount !== undefined
            ? action.totalCount
            : state.totalCount,
      };
    case "configure":
      return {
        ...state,
        fetchMode: action.fetchMode,
        pageSize: action.pageSize,
      };
    case "start-reload":
      // Preserve the table dimensions but show ghost/skeleton cells
      return {
        ...state,
        data: new Array(state.data.length).fill(null),
        loading: true,
        initialized: false,
      };
    case "reset":
      return {
        visibleRegion: defaultVisibleRegion,
        data: [],
        loading: false,
        error: null,
        initialized: false,
        totalCount: null,
        fetchMode: state.fetchMode,
        pageSize: state.pageSize,
      };
    case "error":
      return {
        ...state,
        error: action.error,
        loading: false,
      };
    default:
      return state;
  }
}

type SortAndFilterOptions = {
  /** Column-level sort state, managed externally. When provided, overrides
   * the `order` prop for query building. */
  order?: PostgrestOrder<any>[];
  filters?: PostgrestFilter[];
};

type LazyLoaderOptions = Omit<QueryConfig, "count" | "offset" | "limit"> &
  SortAndFilterOptions & {
    chunkSize?: number;
    sortKey?: string;
  };

interface QueryConfig extends SortAndFilterOptions {
  columns?: string | string[];
  count?: "exact" | "estimated";
  limit?: number;
  identityKey: string;
  lastLoadedRow?: any;
  lastLoadedRowIndex: number;
}

function buildQuery<T>(
  client: PostgrestQueryBuilder<T, any, any>,
  config: QueryConfig,
) {
  const { columns = "*", count, lastLoadedRowIndex } = config;
  const opts = { count };

  let cols: string;
  if (Array.isArray(columns)) {
    cols = columns.join(", ");
  } else {
    cols = columns ?? "*";
  }

  let query = client.select(cols, opts);

  const filters = config.filters ?? [];
  for (const filter of filters) {
    query = filter.apply(query);
  }

  const orderClauses = buildPostgrestOrderClauses(
    config.order ?? [],
    config.identityKey,
  );

  let hasOrdering = false;
  for (const clause of orderClauses) {
    query = query.order(clause.key, clause);
    if (config.lastLoadedRow != null) {
      const op = (clause.ascending ?? true) ? "gt" : "lt";
      const value = config.lastLoadedRow[clause.key];
      query = query[op](clause.key, value);
    }
    hasOrdering = true;
  }

  let offset = null;
  if (!hasOrdering && lastLoadedRowIndex > 0) {
    // We need to load based on offsets
    offset = lastLoadedRowIndex + 1;
  }

  if (config.limit != null) {
    if (offset != null) {
      query = query.range(offset, offset + config.limit - 1);
      console.log(`Random seek from ${offset}, this will be slow`);
    } else {
      query = query.limit(config.limit);
    }
  }

  console.log("query", query.url.search);
  return query;
}

const defaultVisibleRegion: RowRegion = {
  rowIndexStart: 0,
  rowIndexEnd: 0,
};

/** Atom to house the current visible region of the table */
const visibleRegionAtom = atom<RowRegion>(defaultVisibleRegion);

const lazyLoaderCoreStateAtom = atom<LazyLoaderStateCore<any>>({
  loading: false,
  error: null,
  initialized: false,
  totalCount: null,
  fetchMode: "scroll",
  pageSize: 100,
});

/** Current page index (0-based) for paged fetch mode. */
export const chunkPageAtom = atom(0);

/** Footer state for the optional bottom-of-table indicator: rows loaded, the
 * source total when known, load status, and — in paged mode — the current
 * page and total pages. */
export interface TableFooterInfo {
  mode: FetchMode;
  loaded: number;
  total: number | null;
  loading: boolean;
  page: number;
  pageSize: number;
  totalPages: number | null;
}

export const tableFooterAtom = atom<TableFooterInfo>((get) => {
  const core = get(lazyLoaderCoreStateAtom);
  const data = get(tableDataAtom) ?? [];
  let loaded = 0;
  let hasGaps = false;
  for (const row of data) {
    if (row != null) loaded++;
    else hasGaps = true;
  }
  // Total is known when the source reported it, or (scroll mode) when the array
  // is fully populated — otherwise it's still being discovered.
  const total = core.totalCount ?? (hasGaps ? null : data.length);
  const totalPages =
    core.totalCount != null ? Math.ceil(core.totalCount / core.pageSize) : null;
  return {
    mode: core.fetchMode,
    loaded,
    total,
    loading: core.loading,
    page: get(chunkPageAtom),
    pageSize: core.pageSize,
    totalPages,
  };
});

export interface ViewInfo {
  visibleRegion: RowRegion;
  totalCount: number | null;
  loading: boolean;
  error: Error | null;
}

export const viewInfoAtom = atom<ViewInfo>((get) => {
  const state = get(lazyLoaderStateAtom);
  return {
    visibleRegion: state.visibleRegion,
    loading: state.loading,
    error: state.error,
    totalCount: state.data.length,
  };
});

/** Temporary passthrough atom to allow visible region to be separated from the  rest
 * of the lazy loader state
 */
const lazyLoaderStateAtom = atom(
  (get): LazyLoaderState<any> => {
    const core = get(lazyLoaderCoreStateAtom);
    const data = get(tableDataAtom);
    const visibleRegion = get(visibleRegionAtom);
    return {
      ...core,
      data,
      visibleRegion,
    };
  },
  (get, set, update: any) => {
    // Split the state between several places
    if (typeof update === "function") {
      update = update(get(lazyLoaderStateAtom));
    }
    const { visibleRegion, data, ...rest } = update;
    if (visibleRegion != null) {
      set(visibleRegionAtom, visibleRegion);
    }
    if (data != null && data.length > 0) {
      set(tableDataAtom, data);
    }
    if (Object.keys(rest).length > 1) {
      set(lazyLoaderCoreStateAtom, (v) => ({ ...v, ...rest }));
    }
  },
);

function useLazyLoaderReducer() {
  const [state, setState] = ctx.use(lazyLoaderStateAtom);
  const dispatch = useCallback(
    (action: LazyLoaderAction<any>) =>
      setState((prev) => lazyLoadingReducer(prev, action)),
    [setState],
  );
  return [state, dispatch] as const;
}

function buildPostgrestOrderClauses(
  sorts: (ColumnSortEntry | PostgrestOrder<any>)[],
  identityOrder: PostgrestOrder<any> | string,
): PostgrestOrder<any>[] {
  // Clause to build ordering for a Postgrest table.
  // There must be an ordering by identity key, and it must be last...
  const identitySort =
    typeof identityOrder == "string"
      ? { key: identityOrder, ascending: true }
      : identityOrder;
  const identityKey = identitySort.key;
  const clauses: PostgrestOrder<any>[] = sorts.map((sort) => {
    return {
      key: sort.key,
      ascending: sort.ascending,
      nullsFirst: "nullsFirst" in sort ? sort.nullsFirst : false,
    };
  });
  // sort the clauses so the identity clause is last
  const hasIdentityClause = clauses.some((d) => d.key === identityKey);
  if (hasIdentityClause) {
    clauses.sort((a, b) => {
      if (a.key === identityKey) return 1;
      if (b.key === identityKey) return -1;
      return 0;
    });
  } else {
    clauses.push(identitySort);
  }
  return clauses;
}

function _loadMorePostgRESTData<T>(
  client: PostgrestQueryBuilder<T, any>,
  config: QueryConfig & { chunkSize?: number },
  state: LazyLoaderState<T>,
  dispatch: any,
) {
  let rowIndex = indexOfFirstNullInRegion(state.data, state.visibleRegion);
  if (state.loading || rowIndex == null) {
    if (state.initialized) {
      return;
    }
    // For initial/reload queries, default to loading from the start
    rowIndex = rowIndex ?? 0;
  }

  const lastLoadedRowIndex: number = rowIndex - 1;
  let lastLoadedRow = null;
  if (lastLoadedRowIndex >= 0) {
    lastLoadedRow = state.data[lastLoadedRowIndex];
  }

  const { chunkSize = 100, ...rest } = config;

  // Determine the primary sort key from column sorts or the order prop
  const sortKey = config.order?.key ?? "id";

  let cfg: QueryConfig = {
    ...rest,
    limit: chunkSize,
    lastLoadedRow,
    lastLoadedRowIndex,
  };

  // Allows random seeking
  const isInitialQuery = !state.initialized;
  if (isInitialQuery) {
    cfg.count = "exact";
  }

  dispatch({ type: "start-loading" });

  const query = buildQuery(client, cfg);

  query.then((res) => {
    console.log(res);
    const { data, count } = res;
    dispatch({
      type: "loaded",
      data,
      offset: rowIndex,
      totalSize: count,
    });
  });
}

// Ensure only one data load is in progress at a time
const loadMorePostgRESTData = debounce(_loadMorePostgRESTData, 100);

export function useScrollHandler() {
  /** A standardized approach to holding onto the scroll position for the table */
  // Reference to hold onto the scroll position
  const ref = useRef<RowRegion>(null);

  const setVisibleRegion = ctx.useSet(visibleRegionAtom);

  return useCallback(
    debounce((visibleCells: RowRegion) => {
      if (
        visibleCells.rowIndexEnd == ref.current?.rowIndexEnd &&
        visibleCells.rowIndexStart == ref.current?.rowIndexStart
      ) {
        return;
      }
      console.log("Visible cells changed", visibleCells);
      setVisibleRegion(visibleCells);
      ref.current = visibleCells;
    }, 500),
    [setVisibleRegion],
  );
}

export function usePostgRESTLazyLoader(
  endpoint: string,
  table: string,
  config: LazyLoaderOptions = {},
) {
  const getClient = useCallback(() => {
    return new PostgrestClient(endpoint).from(table);
  }, [endpoint, table]);

  const [state, dispatch] = useLazyLoaderReducer();
  const { data, loading } = state;

  // Reset data whenever sort/filter configuration changes so we re-fetch
  const sortFilterKey = useMemo(
    () =>
      JSON.stringify({
        s: config.order,
        v: config.filters,
        i: config.identityKey,
      }),
    [config.order, config.filters, config.identityKey],
  );

  const visibleRegion = ctx.useValue(visibleRegionAtom);

  useEffect(() => {
    dispatch({ type: "reset" });
  }, [sortFilterKey]);

  useAsyncEffect(async () => {
    const client = getClient();
    loadMorePostgRESTData(client, config, state, dispatch);
  }, [data, visibleRegion, sortFilterKey]);

  return {
    data,
    loading,
    dispatch,
    getClient,
  };
}

/** The active view state (a filter's id / column / config), passed to a
 * `fetchChunk` so it can filter server-side. */
export interface FetchChunkFilter {
  id: string;
  columnKey?: string;
  state: any;
}

/** Parameters passed to a `fetchChunk` implementation for one window. */
export interface FetchChunkParams {
  /** Row offset of the requested chunk (chunk-aligned). */
  offset: number;
  /** Maximum rows to return. */
  limit: number;
  /** Aborts when the request is superseded (view change / unmount). */
  signal: AbortSignal;
  /** Active sorts, in priority order. */
  sorts: ColumnSort[];
  /** Active filters (id + column + config). */
  filters: FetchChunkFilter[];
}

/** Result of a `fetchChunk` call. `totalCount` reports the source length when
 * known (drives sparse-array pre-sizing and a proportional scrollbar); omit it
 * for unknown-length sources (the array grows as chunks arrive). */
export interface ChunkResult<T = any> {
  rows: T[];
  totalCount?: number | null;
}

export type FetchChunk<T = any> = (
  params: FetchChunkParams,
) => Promise<ChunkResult<T>>;

/**
 * A generic, backend-agnostic windowed data source. Give it a `fetchChunk`
 * function and it drives the sheet's lazy loading: it loads the chunk covering
 * the first unloaded visible row, pre-sizes the sparse array from `totalCount`,
 * threads the active sorts/filters through so the source can apply them
 * server-side, and re-fetches from scratch when the view state changes. This
 * is the unified seam that upstreams bespoke loaders (`fetchChunk` receives the
 * view state; there's no separate adapter object).
 *
 * Call it from a component rendered inside `DataSheet` (see `ChunkLoaderManager`).
 */
export function useChunkLoader<T = any>(
  fetchChunk: FetchChunk<T>,
  options: { chunkSize?: number; mode?: FetchMode } = {},
) {
  const { chunkSize = 100, mode = "scroll" } = options;
  const [state, dispatch] = useLazyLoaderReducer();
  const visibleRegion = ctx.useValue(visibleRegionAtom);
  const page = ctx.useValue(chunkPageAtom);
  const setPage = ctx.useSet(chunkPageAtom);
  const columnSorts = useSelector((s) => s.columnSorts);
  const activeFilters = useSelector((s) => s.activeFilters);
  const abortRef = useRef<AbortController | null>(null);
  // Tracks the (page, viewKey) already loaded in paged mode, so the effect
  // doesn't re-fetch on unrelated re-renders.
  const loadedRef = useRef<{ page: number; viewKey: string }>({
    page: -1,
    viewKey: "",
  });

  const filters: FetchChunkFilter[] = useMemo(
    () =>
      Array.from(activeFilters.entries()).map(([id, entry]) => ({
        id,
        columnKey: entry.filter?.columnKey,
        state: entry.state,
      })),
    [activeFilters],
  );

  // Publish the windowing config so the footer/pager can read it.
  useEffect(() => {
    dispatch({ type: "configure", fetchMode: mode, pageSize: chunkSize });
  }, [mode, chunkSize]);

  // Reset (re-fetch from scratch) when sorts/filters change, or when the fetch
  // mode switches (paged holds a dense page; scroll needs to re-initialize and
  // pre-size) — so a table can flip between modes cleanly.
  const viewKey = useMemo(
    () => JSON.stringify({ sorts: columnSorts, filters }),
    [columnSorts, filters],
  );
  useEffect(() => {
    dispatch({ type: "reset" });
    setPage(0);
  }, [viewKey, mode]);

  useAsyncEffect(async () => {
    if (state.loading) return;

    // Determine the chunk offset to fetch.
    let offset: number;
    if (mode === "paged") {
      // Fetch the current page once; skip if already loaded for this view.
      if (
        loadedRef.current.page === page &&
        loadedRef.current.viewKey === viewKey
      ) {
        return;
      }
      offset = page * chunkSize;
    } else {
      const rowIndex = indexOfFirstNullInRegion(state.data, visibleRegion);
      if (rowIndex == null && state.initialized) return;
      offset = Math.floor((rowIndex ?? 0) / chunkSize) * chunkSize;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "start-loading" });
    try {
      const result = await fetchChunk({
        offset,
        limit: chunkSize,
        signal: controller.signal,
        sorts: columnSorts,
        filters,
      });
      if (controller.signal.aborted) return;
      const rows = result.rows ?? [];
      if (mode === "paged") {
        loadedRef.current = { page, viewKey };
        // The sheet shows just this page's rows (dense, from index 0); the
        // real source length is tracked separately for the pager.
        dispatch({
          type: "loaded",
          data: rows,
          offset: 0,
          totalSize: rows.length,
          totalCount: result.totalCount ?? null,
        });
      } else {
        dispatch({
          type: "loaded",
          data: rows,
          offset,
          totalSize:
            result.totalCount ??
            Math.max(state.data.length, offset + rows.length),
          totalCount: result.totalCount ?? null,
        });
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        dispatch({ type: "error", error: err as Error });
      }
    }
  }, [state.data, visibleRegion, viewKey, page, mode]);

  return { data: state.data, loading: state.loading, error: state.error };
}

/** Convenience component: runs `useChunkLoader` from inside a `DataSheet`.
 * Render as a child of `DataSheet` (it renders nothing itself). */
export function ChunkLoaderManager<T = any>({
  fetchChunk,
  chunkSize,
  mode,
}: {
  fetchChunk: FetchChunk<T>;
  chunkSize?: number;
  mode?: FetchMode;
}) {
  useChunkLoader(fetchChunk, { chunkSize, mode });
  return null;
}

function indexOfFirstNullInRegion(
  data: any[],
  region: RowRegion,
): number | null {
  for (let i = region.rowIndexStart; i < region.rowIndexEnd; i++) {
    if (data[i] == null) {
      return i;
    }
  }
  return null;
}

export function useTestLazyLoader(config: LazyLoaderOptions = {}) {
  const [state, dispatch] = useLazyLoaderReducer();
  const { data, loading } = state;

  const visibleRegion = ctx.useValue(visibleRegionAtom);

  useAsyncEffect(async () => {
    testDataLoader(config, state, dispatch);
  }, [data, visibleRegion]);

  return {
    data,
    loading,
    dispatch,
  };
}

function testDataLoader(
  config: { chunkSize: number },
  state: LazyLoaderState<any>,
  dispatch,
) {
  const sortKey = "id";
  const rowIndex = indexOfFirstNullInRegion(state.data, state.visibleRegion);
  if (state.loading || rowIndex == null) {
    if (state.initialized) {
      return;
    }
  }

  const chunkSize = 10;

  let cfg: QueryConfig = {
    //...rest,
    limit: chunkSize,
    offset: null,
  };

  // Allows random seeking
  const isInitialQuery = !state.initialized;
  if (isInitialQuery) {
    cfg.count = "exact";
  }

  // This only works for forward queries
  if (!isInitialQuery) {
    cfg.after = state.data[rowIndex - 1]?.[sortKey];
    if (cfg.after == null) {
      cfg.offset = rowIndex;
    }
  }

  dispatch({ type: "start-loading" });

  const query = testQueryFunc(cfg);
  query.then((res) => {
    console.log(res);
    const { data, count } = res;
    dispatch({
      type: "loaded",
      data,
      offset: rowIndex,
      totalSize: count,
    });
  });
}

interface QueryParams {
  count: "exact" | "estimated";
  limit: number;
  offset?: number;
  after?: number;
}

const testQueryFunc = async (
  cfg: QueryParams,
): Promise<{
  data: any[];
  count: number | null;
}> => {
  console.log(cfg);
  let offset = null;
  if (cfg.after) {
    offset = cfg.after;
  } else if (cfg.offset) {
    offset = cfg.offset;
  }

  let count = cfg.limit;
  const totalCount = 50000;
  count = Math.min(count, totalCount - offset);

  // wait for a little bit before returning
  await sleep(100);

  return {
    data: buildSyntheticData(offset, count),
    count: cfg.count != null ? 50000 : undefined,
  };
};

function buildSyntheticData(offset: number, count: number | null) {
  console.log(
    `Getting data at indices between ${offset} and ${offset + count}`,
  );
  return range(offset, offset + count).map((i) => {
    const id = i + 1;
    return {
      id,
      name: `row ${id} has some long text content`,
    };
  });
}
