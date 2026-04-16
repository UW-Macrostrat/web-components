/** Lazy loading of data from a PostgREST endpoint */

import { useAsyncEffect } from "@macrostrat/ui-components";
import { debounce, range } from "underscore";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import update, { Spec } from "immutability-helper";
import {
  PostgrestClient,
  PostgrestFilterBuilder,
  PostgrestQueryBuilder,
} from "@supabase/postgrest-js";
import { adjustArraySize, RowRegion, sleep } from "./loading-utils.ts";
import { ctx } from "../provider.ts";

interface LazyLoaderState<T> {
  data: (T | null)[];
  loading: boolean;
  error: Error | null;
  visibleRegion: RowRegion;
  initialized: boolean;
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
  | { type: "loaded"; data: T[]; offset: number; totalSize: number }
  | { type: "error"; error: Error }
  | { type: "set-visible"; region: RowRegion }
  | { type: "update-data"; changes: Spec<T[]> }
  | { type: "reset" }
  | { type: "start-reload" };

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
    case "set-visible":
      return {
        ...state,
        visibleRegion: action.region,
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
        data: [],
        loading: false,
        error: null,
        visibleRegion: { rowIndexStart: 0, rowIndexEnd: 0 },
        initialized: false,
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
  offset?: number;
  after?: any; //identitykey value
  identityKey: string;
}

function buildQuery<T>(
  client: PostgrestQueryBuilder<T, any, any>,
  config: QueryConfig,
) {
  const { columns = "*", count } = config;
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

  for (const clause of orderClauses) {
    query = query.order(clause.key, clause);
    if (clause.key == config.identityKey && config.after != null) {
      const op = (clause.ascending ?? true) ? "gt" : "lt";
      query = query[op](clause.key, config.after);
    }
  }

  if (config.limit != null) {
    if (config.offset != null) {
      query = query.range(config.offset, config.offset + config.limit - 1);
      console.log(`Random seek from ${config.offset}, this will be slow`);
    } else {
      query = query.limit(config.limit);
    }
  }

  console.log("query", query.url.search);
  return query;
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

function _loadMoreData<T>(
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

  const { chunkSize = 100, ...rest } = config;

  // Determine the primary sort key from column sorts or the order prop
  const sortKey = config.order?.key ?? "id";

  let cfg: QueryConfig = {
    ...rest,
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

  const query = buildQuery(client, cfg);

  console.log("Loading more data", cfg);
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
const loadMoreData = debounce(_loadMoreData, 100);

export function usePostgRESTLazyLoader(
  endpoint: string,
  table: string,
  config: LazyLoaderOptions = {},
) {
  const initialState: LazyLoaderState<any> = {
    data: [],
    loading: false,
    error: null,
    visibleRegion: { rowIndexStart: 0, rowIndexEnd: 0 },
    initialized: false,
  };

  const getClient = useCallback(() => {
    return new PostgrestClient(endpoint).from(table);
  }, [endpoint, table]);

  const [state, dispatch] = useReducer(lazyLoadingReducer, initialState);
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

  useEffect(() => {
    dispatch({ type: "reset" });
  }, [sortFilterKey]);

  useAsyncEffect(async () => {
    const client = getClient();
    loadMoreData(client, config, state, dispatch);
  }, [
    data,
    state.visibleRegion.rowIndexStart,
    state.visibleRegion.rowIndexEnd,
    sortFilterKey,
  ]);

  // Reference to hold onto the scroll position
  const ref = useRef(null);

  const onScroll = useCallback(
    debounce((visibleCells: RowRegion) => {
      if (
        visibleCells.rowIndexEnd == ref.current?.rowIndexEnd &&
        visibleCells.rowIndexStart == ref.current?.rowIndexStart
      ) {
        return;
      }
      console.log("Visible cells changed", visibleCells);
      dispatch({
        type: "set-visible",
        region: visibleCells,
      });
      ref.current = visibleCells;
    }, 500),
    [dispatch],
  );

  return {
    data,
    loading,
    onScroll,
    dispatch,
    getClient,
  };
}

function getRowIndexToLoadFrom<T>(
  data: (T | null)[],
  visibleRegion: RowRegion,
  chunkSize: number,
) {
  return indexOfFirstNullInRegion(data, visibleRegion);
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
  const initialState: LazyLoaderState<any> = {
    data: [],
    loading: false,
    error: null,
    visibleRegion: { rowIndexStart: 0, rowIndexEnd: 0 },
    initialized: false,
  };

  const [state, dispatch] = useReducer(lazyLoadingReducer, initialState);
  const { data, loading } = state;

  useAsyncEffect(async () => {
    testDataLoader(config, state, dispatch);
  }, [
    data,
    state.visibleRegion.rowIndexStart,
    state.visibleRegion.rowIndexEnd,
  ]);

  // Reference to hold onto the scroll position
  const ref = useRef(null);

  const onScroll = useCallback(
    debounce((visibleCells: RowRegion) => {
      if (
        visibleCells.rowIndexEnd == ref.current?.rowIndexEnd &&
        visibleCells.rowIndexStart == ref.current?.rowIndexStart
      ) {
        return;
      }
      console.log("Visible cells changed", visibleCells);
      dispatch({
        type: "set-visible",
        region: visibleCells,
      });
      ref.current = visibleCells;
    }, 500),
    [dispatch],
  );

  return {
    data,
    loading,
    onScroll,
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
      name: `This is some long text content in row ${id}`,
    };
  });
}
