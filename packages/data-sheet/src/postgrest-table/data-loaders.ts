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
import { ctx, dataProviderAtom, tableDataAtom, useSelector } from "../provider.ts";
import { atom } from "jotai";
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

/** Operators available for server-side column filtering via PostgREST.
 * `cs`/`ov` target array columns (contains / overlaps). */
export type PostgrestFilterOperator =
  | "eq"
  | "neq"
  | "like"
  | "ilike"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "is"
  | "cs"
  | "ov";

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
    // Array-column operators need a list value and postgrest-js's dedicated
    // builders (which emit the `{…}` array literal), not a scalar `.filter`.
    if (cf.operator === "cs") {
      req = req.contains(cf.key, splitFilterList(cf.value));
      continue;
    }
    if (cf.operator === "ov") {
      req = req.overlaps(cf.key, splitFilterList(cf.value));
      continue;
    }
    const val =
      cf.operator === "like" || cf.operator === "ilike"
        ? `*${cf.value}*`
        : cf.value;
    req = req.filter(cf.key, cf.operator, val);
  }
  return req;
}

/** Split a comma-separated filter value into trimmed, non-empty tokens (the set
 * for `cs`/`ov`); a single value yields a one-element list. */
function splitFilterList(value: any): string[] {
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
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
    case "reset":
      // A view change (or initial load) re-fetches from scratch. Rather than
      // blanking the table (which reads as a jarring empty flash while the
      // request is in flight — very visible on sort/filter), pre-size to a page
      // of `null` ghost/skeleton rows so the body stays populated and the load
      // is legible. `loaded` then adjusts the array to the real size.
      return {
        visibleRegion: defaultVisibleRegion,
        data: new Array(Math.max(state.pageSize, 0)).fill(null),
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
  /** The identity column's default ordering (used when nothing in `order`
   * already sorts it). A string ⇒ ascending; pass a `PostgrestOrder` to set the
   * direction (e.g. `source_id` descending). */
  identityOrder?: PostgrestOrder<any>;
  lastLoadedRow?: any;
  lastLoadedRowIndex: number;
}

/** Format a value for a PostgREST logic-tree condition. Reserved characters
 * (`, . : ( )`), spaces, quotes, and backslashes require the value to be
 * double-quoted, with `"` and `\` backslash-escaped inside — otherwise a map
 * name containing a comma would break the `or=(...)` parse. */
function formatKeysetValue(v: any): string {
  const s = String(v);
  if (s === "" || /[,.:()"\\ ]/.test(s)) {
    return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return s;
}

/** An equality condition for the cursor prefix (`col.eq.v`, or `col.is.null`). */
function keysetEq(key: string, v: any): string {
  return v == null ? `${key}.is.null` : `${key}.eq.${formatKeysetValue(v)}`;
}

/**
 * Build the compound keyset predicate (the body of an `or=(...)`) selecting
 * rows strictly after `lastRow` under `clauses` (lexicographic, last clause is
 * the identity tiebreaker):
 *
 *   (c1 OP1 v1)
 *   OR (c1 = v1 AND c2 OP2 v2)
 *   OR (c1 = v1 AND c2 = v2 AND c3 OP3 v3) …
 *
 * `OPi` is `gt` for an ascending clause, `lt` for descending. Nulls-last: a
 * null pivot value has no strictly-ordered non-null successor at its level, so
 * that term is skipped and the tie defers to deeper clauses (the identity key
 * is non-null, so at least its term is always emitted). Returns `null` if no
 * term applies. (Known limit: rows whose *sort* column is null aren't picked up
 * across the non-null→null boundary — an edge for nullable sort columns; the
 * non-null identity tiebreaker keeps pagination from stalling.)
 */
function buildKeysetPredicate(
  clauses: PostgrestOrder<any>[],
  lastRow: any,
): string | null {
  const terms: string[] = [];
  for (let i = 0; i < clauses.length; i++) {
    const v = lastRow[clauses[i].key];
    if (v == null) continue;
    const conds: string[] = [];
    for (let j = 0; j < i; j++) {
      conds.push(keysetEq(clauses[j].key, lastRow[clauses[j].key]));
    }
    const op = (clauses[i].ascending ?? true) ? "gt" : "lt";
    conds.push(`${clauses[i].key}.${op}.${formatKeysetValue(v)}`);
    terms.push(conds.length === 1 ? conds[0] : `and(${conds.join(",")})`);
  }
  return terms.length > 0 ? terms.join(",") : null;
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
    config.identityOrder ?? config.identityKey,
  );

  let hasOrdering = false;
  for (const clause of orderClauses) {
    query = query.order(clause.key, clause);
    hasOrdering = true;
  }

  // Keyset cursor: rows strictly after the last loaded row under the active
  // ordering. This MUST be a compound predicate, not an independent `gt`/`lt`
  // per column: with a leading low-cardinality sort (e.g. `state`), a plain
  // `state.gt.X AND source_id.lt.Y` drops every row sharing the cursor's
  // `state` (`state.gt.X` is false for them). The lexicographic form keeps the
  // tie broken by the next column, ending on the non-null identity key.
  if (config.lastLoadedRow != null && hasOrdering) {
    const pred = buildKeysetPredicate(orderClauses, config.lastLoadedRow);
    if (pred != null) query = query.or(pred);
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

/** Auto-load this many pages per burst, then pause (null ⇒ unbounded). Set by
 * a consumer (e.g. `DataPanel`'s `autoLoadPages` prop). */
export const autoLoadPagesAtom = atom<number | null>(null);

/** Row count at the last manual "load more" — the point auto-load resumes
 * counting a fresh burst from. */
export const resumeBaselineAtom = atom(0);

/** Live loading controls, read from the store rather than passed down a
 * boundary contract. Any component inside the provider can call
 * `useLoadControls()` — a footer, a toolbar button, a status line — without the
 * renderer wiring a specific prop shape to it. */
export interface LoadControls {
  /** Load the next page and resume auto-loading (clears a paused state). */
  loadMore: () => void;
  /** A fetch is in flight. */
  loading: boolean;
  /** More rows remain to load. */
  hasMore: boolean;
  /** Rows loaded so far. */
  loaded: number;
  /** Source total when known, else `null`. */
  total: number | null;
  /** Auto-load is paused at the `autoLoadPages` checkpoint. */
  paused: boolean;
  /** Auto-load is currently permitted (`hasMore && !loading && !paused`) —
   * used to gate an infinite-scroll sentinel. */
  canLoadMore: boolean;
  /** Advance one page *without* resuming a paused auto-load (the sentinel
   * uses this; `loadMore` is the manual, un-pausing variant). */
  advance: () => void;
}

/** Store-managed load controls (see `LoadControls`). Reads the loader's footer
 * state, the loaded rows, and the pause atoms; `loadMore`/`advance` set the
 * visible region so the loader fetches the next chunk. */
export function useLoadControls(): LoadControls {
  const footer = ctx.useValue(tableFooterAtom);
  const data = ctx.useValue(tableDataAtom) ?? [];
  const { isLocalProvider } = ctx.useValue(dataProviderAtom);
  const resumeBaseline = ctx.useValue(resumeBaselineAtom);
  const autoLoadPages = ctx.useValue(autoLoadPagesAtom);
  const setResumeBaseline = ctx.useSet(resumeBaselineAtom);
  const setVisibleRegion = ctx.useSet(visibleRegionAtom);

  let loadedCount = 0;
  for (const row of data) if (row != null) loadedCount++;
  const pageSize = footer.pageSize || 100;
  const dataLength = data.length;
  const hasMore = !isLocalProvider && loadedCount < dataLength;
  const paused =
    autoLoadPages != null &&
    loadedCount - resumeBaseline >= autoLoadPages * pageSize;
  const canLoadMore = hasMore && !footer.loading && !paused;

  const advance = useCallback(() => {
    setVisibleRegion({
      rowIndexStart: 0,
      rowIndexEnd: Math.min(loadedCount + pageSize, dataLength),
    });
  }, [setVisibleRegion, loadedCount, pageSize, dataLength]);

  const loadMore = useCallback(() => {
    setResumeBaseline(loadedCount);
    advance();
  }, [setResumeBaseline, loadedCount, advance]);

  return {
    loadMore,
    loading: footer.loading,
    hasMore,
    loaded: footer.loaded,
    total: footer.total,
    paused,
    canLoadMore,
    advance,
  };
}

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
    // Propagate the data array even when empty — a `reset` (view change) must
    // clear the stale rows so the re-fetch rebuilds a correctly-sized array
    // (otherwise a filtered/sorted result splices over a stale, larger array).
    if (data != null) {
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
  // Build the ORDER BY for a PostgREST query. Two invariants:
  //  1. Each column appears at most once. Keyset pagination adds a `gt`/`lt`
  //     cursor predicate per order clause, so a duplicated column (e.g. the
  //     identity key present in both a base order and an active sort, with
  //     opposite directions) would emit contradictory `col=lt.X&col=gt.X`
  //     bounds that match nothing — an infinite empty-result reload. First
  //     occurrence wins (active sorts should be passed ahead of base order).
  //  2. The identity key is ordered last (a stable tiebreaker for the cursor),
  //     appended with its default direction only if no clause already sorts it.
  const identitySort =
    typeof identityOrder == "string"
      ? { key: identityOrder, ascending: true }
      : identityOrder;
  const identityKey = identitySort.key;

  const seen = new Set<string>();
  const clauses: PostgrestOrder<any>[] = [];
  for (const sort of sorts) {
    if (seen.has(sort.key)) continue;
    seen.add(sort.key);
    clauses.push({
      key: sort.key,
      ascending: sort.ascending,
      nullsFirst: "nullsFirst" in sort ? sort.nullsFirst : false,
    });
  }

  if (seen.has(identityKey)) {
    // Move the (already-deduped) identity clause to the end, keeping the
    // direction the active sort chose.
    const idx = clauses.findIndex((c) => c.key === identityKey);
    const [idClause] = clauses.splice(idx, 1);
    clauses.push(idClause);
  } else {
    clauses.push({
      key: identitySort.key,
      ascending: identitySort.ascending ?? true,
      nullsFirst: (identitySort as any).nullsFirst ?? false,
    });
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
export interface FetchDataFilter {
  id: string;
  columnKey?: string;
  state: any;
  /** Client-side row predicate (from the `TableFilter`). Server providers
   * ignore it and translate `columnKey` + `state` instead. */
  predicate?: (row: any, state: any) => boolean;
}

/** Parameters passed to a `fetchChunk` implementation for one window. */
export interface FetchDataParams {
  /** Row offset of the requested chunk (chunk-aligned). */
  offset: number;
  /** Maximum rows to return. */
  limit: number;
  /** Aborts when the request is superseded (view change / unmount). */
  signal: AbortSignal;
  /** Active sorts, in priority order. */
  sorts: ColumnSort[];
  /** Active filters (id + column + config). */
  filters: FetchDataFilter[];
  /** In scroll mode, the already-loaded row immediately before this chunk
   * (and its data-array index), or `null` at the start / in paged mode. Keyset
   * sources can page from this cursor (e.g. `WHERE key > cursor`) instead of a
   * slow `OFFSET`; offset-based sources can ignore it. */
  cursor?: { row: any; index: number } | null;
}

/** Result of a `fetchChunk` call. `totalCount` reports the source length when
 * known (drives sparse-array pre-sizing and a proportional scrollbar); omit it
 * for unknown-length sources (the array grows as chunks arrive). */
export interface FetchDataResult<T = any> {
  rows: T[];
  totalCount?: number | null;
}

export type FetchData<T = any> = (
  params: FetchDataParams,
) => Promise<FetchDataResult<T>>;

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
  fetchData(params: FetchDataParams): Promise<FetchDataResult<T>>;
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
  const identity: (row: T) => string | number =
    options.identity ?? defaultLocalIdentity;
  return {
    identity,
    async fetchData({ offset, limit, sorts, filters }) {
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

export interface FetchDataOptions {
  pageSize?: number;
  fetchMode?: FetchMode;
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
export function useDataLoader<T = any>(
  fetchChunk: FetchData<T>,
  options: FetchDataOptions = {},
) {
  const { pageSize = 100, fetchMode = "scroll" } = options;
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

  const filters: FetchDataFilter[] = useMemo(
    () =>
      (Array.from(activeFilters.entries()) as [any, any][]).map(
        ([id, entry]) => ({
          id,
          columnKey: entry.filter?.columnKey,
          state: entry.state,
          predicate: entry.filter?.predicate,
        }),
      ),
    [activeFilters],
  );

  // Publish the windowing config so the footer/pager can read it.
  useEffect(() => {
    dispatch({ type: "configure", fetchMode, pageSize: pageSize });
  }, [fetchMode, pageSize]);

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
  }, [viewKey, fetchMode, refreshToken]);

  useAsyncEffect(async () => {
    if (state.loading) return;

    // Determine the chunk offset to fetch, and (scroll mode) a keyset cursor:
    // the already-loaded row just before the chunk, so keyset sources can page
    // from it instead of a slow OFFSET.
    let offset: number;
    let cursor: { row: any; index: number } | null = null;
    if (fetchMode === "paged") {
      // Fetch the current page once; skip if already loaded for this view.
      if (
        loadedRef.current.page === page &&
        loadedRef.current.viewKey === viewKey
      ) {
        return;
      }
      offset = page * pageSize;
    } else {
      const rowIndex = indexOfFirstNullInRegion(state.data, visibleRegion);
      if (rowIndex == null && state.initialized) return;
      offset = Math.floor((rowIndex ?? 0) / pageSize) * pageSize;
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
        limit: pageSize,
        signal: controller.signal,
        sorts: columnSorts,
        filters,
        cursor,
      });
      if (controller.signal.aborted) return;
      const rows = result.rows ?? [];
      if (fetchMode === "paged") {
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
        // Size the (sparse) array. With a known total, size to it. Without one
        // (keyset / infinite scroll), use the short-chunk heuristic: a chunk
        // smaller than the page size means we've hit the end — size exactly to
        // the loaded rows; otherwise pad one more page of nulls so scrolling
        // into them triggers the next fetch. So an unknown-length source never
        // needs a count — it grows a page at a time until a short chunk.
        const loadedEnd = offset + rows.length;
        let totalSize: number;
        if (result.totalCount != null) {
          totalSize = result.totalCount;
        } else {
          const reachedEnd = rows.length < pageSize;
          totalSize = reachedEnd ? loadedEnd : loadedEnd + pageSize;
        }
        dispatch({
          type: "loaded",
          data: rows,
          offset,
          totalSize,
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
  }, [state.data, visibleRegion, viewKey, page, fetchMode]);

  return { data: state.data, loading: state.loading, error: state.error };
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
  /** Default ordering direction of the identity key (applied when no active
   * sort targets it). `false` ⇒ the table defaults to identity-descending
   * (e.g. newest `source_id` first) without a redundant `baseOrder` entry that
   * would otherwise collide with the identity tiebreaker. Defaults to `true`. */
  identityAscending?: boolean;
  columns?: string | string[];
  /** Order applied before the active column sorts (identity key appended last). */
  baseOrder?: PostgrestOrder<any>[];
  /** A transform over the query builder, applied as a base filter (the `filter` prop). */
  baseFilter?: (
    q: PostgrestFilterBuilder<any, any, any, any>,
  ) => PostgrestFilterBuilder<any, any, any, any>;
  /** Translate a stored filter entry to a `PostgrestFilter` (return `null` to
   * skip). Defaults to the `{ key, operator, value }` column-filter shape. */
  translateFilter?: (f: FetchDataFilter) => PostgrestFilter | null;
}): FetchData<T> {
  const translate = config.translateFilter ?? standardColumnFilter;
  return async ({ limit, signal, sorts, filters, cursor }) => {
    const client = new PostgrestClient(config.endpoint).from(config.table);

    // Active sorts first so they win the by-key dedupe in
    // `buildPostgrestOrderClauses` (a user sort on the identity column
    // overrides its default direction rather than colliding with it).
    const order: PostgrestOrder<any>[] = [
      ...sorts.map((s) => ({ key: s.key, ascending: s.ascending })),
      ...(config.baseOrder ?? []),
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
      identityOrder: {
        key: config.identityKey,
        ascending: config.identityAscending ?? true,
      },
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

/**
 * A full PostgREST `TableDataProvider`: the read side (`fetchData` + row
 * `identity`) plus persistence — `saveRows` (upsert) and `deleteRows` (by
 * identity). Pass it to `DataSheet`'s `provider` prop. The mutation methods
 * throw on error so the Save action surfaces it.
 */
export function createPostgRESTProvider<T = any>(config: {
  endpoint: string;
  table: string;
  identityKey: string;
  /** Default ordering direction of the identity key (see
   * `createPostgRESTFetchChunk`). `false` ⇒ identity-descending by default. */
  identityAscending?: boolean;
  columns?: string | string[];
  baseOrder?: PostgrestOrder<any>[];
  baseFilter?: (
    q: PostgrestFilterBuilder<any, any, any, any>,
  ) => PostgrestFilterBuilder<any, any, any, any>;
  translateFilter?: (f: FetchDataFilter) => PostgrestFilter | null;
}): TableDataProvider<T> {
  const from = () => new PostgrestClient(config.endpoint).from(config.table);
  return {
    fetchData: createPostgRESTFetchChunk<T>(config),
    identity: (row: any) => row?.[config.identityKey],
    async saveRows(rows) {
      const res: any = await from().upsert(rows as any[], {
        defaultToNull: false,
      });
      if (res?.error != null) throw res.error;
    },
    async deleteRows(ids) {
      const res: any = await from().delete().in(config.identityKey, ids);
      if (res?.error != null) throw res.error;
    },
  };
}

/** Default filter translation for the built-in operator `columnFilter`: its
 * column is `f.columnKey`, its state is `{ operator, value }`. (Also accepts a
 * `key` in state for hand-rolled filters.) */
function standardColumnFilter(f: FetchDataFilter): PostgrestFilter | null {
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
  // Clamp to the array length: a visible region can outlast the data it was
  // set against (e.g. a keyset page hits the end of a filtered set and the
  // array shrinks below a region end set before the shrink). Scanning past
  // `data.length` reads `undefined` as a fillable null and re-fetches the same
  // now-out-of-range offset forever — the tail-of-filtered-set reload loop.
  const end = Math.min(region.rowIndexEnd, data.length);
  for (let i = region.rowIndexStart; i < end; i++) {
    if (data[i] == null) {
      return i;
    }
  }
  return null;
}
