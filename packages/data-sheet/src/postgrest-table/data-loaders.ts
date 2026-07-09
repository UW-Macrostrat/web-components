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
import { adjustArraySize, RowRegion } from "./loading-utils.ts";
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

/** Bump this to force the active chunk loader to reset and re-fetch from
 * scratch — e.g. after a mutation (save/delete) that invalidates loaded rows. */
export const dataRefreshTokenAtom = atom(0);

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

/** The active view state (a filter's id / column / config), passed to a
 * `fetchChunk`. A server provider translates `columnKey` + `state` into a
 * query; a local (in-memory) provider applies `predicate` directly. Both come
 * from the same `TableFilter`, so one filter definition serves either target. */
export interface FetchChunkFilter {
  id: string;
  columnKey?: string;
  state: any;
  /** Client-side row predicate (from the `TableFilter`). Server providers
   * ignore it and translate `columnKey` + `state` instead. */
  predicate?: (row: any, state: any) => boolean;
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
  /** In scroll mode, the already-loaded row immediately before this chunk
   * (and its data-array index), or `null` at the start / in paged mode. Keyset
   * sources can page from this cursor (e.g. `WHERE key > cursor`) instead of a
   * slow `OFFSET`; offset-based sources can ignore it. */
  cursor?: { row: any; index: number } | null;
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
 * A table's data source, addressed uniformly whether it's an in-memory array or
 * a remote backend. `fetchChunk` returns a window with the active sorts/filters
 * already applied (in memory by the local provider, in SQL by a server one);
 * `identity` addresses a row for edits/mutations — stable across re-sorts,
 * unlike an array index. The mutation ops are present only for editable /
 * persisting sources. The in-memory case (`createLocalProvider`) is just the
 * degenerate implementation, so local and server tables share one path.
 */
export interface TableDataProvider<T = any> {
  fetchChunk(params: FetchChunkParams): Promise<ChunkResult<T>>;
  identity(row: T): string | number;
  saveRows?(rows: T[]): Promise<void>;
  deleteRows?(ids: Array<string | number>): Promise<void>;
  insertRow?(row: Partial<T>): Promise<void>;
}

/**
 * The degenerate provider: an in-memory array. `fetchChunk` applies the active
 * filter predicates and sorts over the array and returns the requested slice
 * plus the (fully-known) total — the same view engine used for client-side
 * tables, expressed as a provider.
 */
export function createLocalProvider<T = any>(
  data: T[],
  options: { identity?: (row: T) => string | number } = {},
): TableDataProvider<T> {
  const identity = options.identity ?? defaultLocalIdentity;
  return {
    identity,
    async fetchChunk({ offset, limit, sorts, filters }) {
      let rows = data;
      if (filters != null && filters.length > 0) {
        rows = rows.filter((row) =>
          filters.every((f) =>
            f.predicate != null ? f.predicate(row, f.state) : true,
          ),
        );
      }
      if (sorts != null && sorts.length > 0) {
        rows = [...rows].sort(compareRowsBySorts(sorts));
      }
      return {
        rows: rows.slice(offset, offset + limit),
        totalCount: rows.length,
      };
    },
  };
}

// Stable synthetic identity for in-memory rows lacking a natural `id`. Keyed by
// object reference (a local data array keeps the same row objects across
// re-sorts), so edits survive re-ordering even without an id field.
const _syntheticRowIds = new WeakMap<object, string>();
let _syntheticRowCounter = 0;
function defaultLocalIdentity(row: any): string | number | undefined {
  if (row == null) return undefined;
  if (row.id != null) return row.id;
  if (typeof row !== "object") return row;
  let id = _syntheticRowIds.get(row);
  if (id == null) {
    id = `__row_${_syntheticRowCounter++}`;
    _syntheticRowIds.set(row, id);
  }
  return id;
}

/** Multi-key row comparator (priority order; nulls first when ascending),
 * shared by the local provider and any other in-memory sort. */
export function compareRowsBySorts(sorts: ColumnSort[]) {
  return (a: any, b: any): number => {
    for (const sort of sorts) {
      const av = a?.[sort.key];
      const bv = b?.[sort.key];
      if (av == null && bv == null) continue;
      if (av == null) return sort.ascending ? -1 : 1;
      if (bv == null) return sort.ascending ? 1 : -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      if (cmp !== 0) return sort.ascending ? cmp : -cmp;
    }
    return 0;
  };
}

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
  const refreshToken = ctx.useValue(dataRefreshTokenAtom);
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
        predicate: entry.filter?.predicate,
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
  }, [viewKey, mode, refreshToken]);

  useAsyncEffect(async () => {
    if (state.loading) return;

    // Determine the chunk offset to fetch, and (scroll mode) a keyset cursor:
    // the already-loaded row just before the chunk, so keyset sources can page
    // from it instead of a slow OFFSET.
    let offset: number;
    let cursor: { row: any; index: number } | null = null;
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
      const prev = offset > 0 ? state.data[offset - 1] : null;
      if (prev != null) cursor = { row: prev, index: offset - 1 };
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
        cursor,
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
          // Preserve a previously-known total when a chunk omits it (undefined):
          // keyset pages can't re-count (the cursor filter would skew it), so
          // only the initial cursorless fetch reports the total.
          totalCount: result.totalCount,
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

/**
 * Build a `fetchChunk` backed by a PostgREST endpoint, for use with
 * `useChunkLoader` / `ChunkLoaderManager`. It reuses `buildQuery`, so it pages
 * with **keyset pagination** (via the loader's `cursor`) whenever the query is
 * ordered — falling back to `OFFSET` only when it isn't — and threads the
 * active store sorts/filters into the query. The total count is requested only
 * on the initial (cursorless) fetch, since a keyset cursor filter would skew it.
 */
export function createPostgRESTFetchChunk<T = any>(config: {
  endpoint: string;
  table: string;
  identityKey: string;
  columns?: string | string[];
  /** Order applied before the active column sorts (identity key appended last). */
  baseOrder?: PostgrestOrder<any>[];
  /** A transform over the query builder, applied as a base filter (the `filter` prop). */
  baseFilter?: (
    q: PostgrestFilterBuilder<any, any, any, any>,
  ) => PostgrestFilterBuilder<any, any, any, any>;
  /** Translate a stored filter entry to a `PostgrestFilter` (return `null` to
   * skip). Defaults to the `{ key, operator, value }` column-filter shape. */
  translateFilter?: (f: FetchChunkFilter) => PostgrestFilter | null;
}): FetchChunk<T> {
  const translate = config.translateFilter ?? standardColumnFilter;
  return async ({ limit, signal, sorts, filters, cursor }) => {
    const client = new PostgrestClient(config.endpoint).from(config.table);

    const order: PostgrestOrder<any>[] = [
      ...(config.baseOrder ?? []),
      ...sorts.map((s) => ({ key: s.key, ascending: s.ascending })),
    ];

    const pgFilters: PostgrestFilter[] = [];
    if (config.baseFilter != null) {
      const apply = config.baseFilter;
      pgFilters.push({ type: "filter", apply });
    }
    for (const f of filters) {
      const pf = translate(f);
      if (pf != null) pgFilters.push(pf);
    }

    const query = buildQuery(client, {
      columns: config.columns,
      // Only the initial (cursorless) fetch reports an accurate total.
      count: cursor == null ? "exact" : undefined,
      limit,
      identityKey: config.identityKey,
      order,
      filters: pgFilters,
      lastLoadedRow: cursor?.row ?? null,
      lastLoadedRowIndex: cursor?.index ?? -1,
    });

    const res: any = await query;
    if (signal.aborted) return { rows: [] };
    if (res?.error != null) throw res.error;
    const rows = res?.data ?? [];
    return res?.count != null ? { rows, totalCount: res.count } : { rows };
  };
}

/** Default filter translation for the built-in operator `columnFilter`: its
 * column is `f.columnKey`, its state is `{ operator, value }`. (Also accepts a
 * `key` in state for hand-rolled filters.) */
function standardColumnFilter(f: FetchChunkFilter): PostgrestFilter | null {
  const s = f.state;
  if (s == null) return null;
  const key = f.columnKey ?? s.key;
  if (key != null && s.operator != null && s.value != null && s.value !== "") {
    return standardizeFilter({ key, operator: s.operator, value: s.value });
  }
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
