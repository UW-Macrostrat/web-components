import { ColumnSort, TableActionContext, TableElementStatus } from "./types.ts";
import { atom } from "jotai";

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

/** Bump this to force the active chunk loader to reset and re-fetch from
 * scratch — e.g. after a mutation (save/delete) that invalidates loaded rows. */
export const dataRefreshTokenAtom = atom(0);

/** Persist all pending changes through a data provider: added rows via
 * `insertRow`, edited rows via `saveRows`, deleted rows via `deleteRows`
 * (addressed by `provider.identity`). Used by the built-in Save action when an
 * explicit provider owns persistence. */
export async function persistViaProvider<T>(
  provider: TableDataProvider<T>,
  ctx: TableActionContext<T>,
): Promise<void> {
  const base = (ctx.data ?? []) as any[];
  const updates = (ctx.updatedData ?? []) as any[];
  const status = (ctx.rowStatus ?? []) as any[];
  const n = Math.max(base.length, updates.length, status.length);
  const toSave: T[] = [];
  const toInsert: T[] = [];
  const toDelete: Array<string | number> = [];
  for (let i = 0; i < n; i++) {
    if (status[i] === TableElementStatus.DELETED) {
      const id = provider.identity(base[i]);
      if (id != null) toDelete.push(id);
      continue;
    }
    const upd = updates[i];
    const hasEdit =
      upd != null && typeof upd === "object" && Object.keys(upd).length > 0;
    if (status[i] === TableElementStatus.ADDED) {
      toInsert.push({ ...base[i], ...upd } as T);
    } else if (hasEdit) {
      toSave.push({ ...base[i], ...upd } as T);
    }
  }
  if (toDelete.length > 0 && provider.deleteRows != null) {
    await provider.deleteRows(toDelete);
  }
  for (const row of toInsert) {
    if (provider.insertRow != null) await provider.insertRow(row);
  }
  if (toSave.length > 0 && provider.saveRows != null) {
    await provider.saveRows(toSave);
  }
}
export type FetchMode = "scroll" | "paged";

export interface FetchDataOptions {
  pageSize?: number;
  fetchMode?: FetchMode;
}
