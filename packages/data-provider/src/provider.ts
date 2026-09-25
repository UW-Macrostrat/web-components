/** Data provider for information that needs to be loaded in bulk for frontend views */
import baseFetch from "cross-fetch";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import h from "@macrostrat/hyper";
import { StoreApi, useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import {
  ColumnGeoJSONRecord,
  ColumnGeoJSONRecordWithID,
  Environment,
  MacrostratRef,
  StratName,
  Interval,
} from "@macrostrat/api-types";
import {
  type ColumnProjectScope,
  fetchAllColumns,
  fetchEnvironments,
  fetchIntervals,
  fetchLithAttributes,
  fetchLithologies,
  fetchTimescales,
  fetchRefs,
  fetchStratNames,
  type ColumnStatusCode,
} from "./fetch";
import { APIProvider, usePrevious } from "@macrostrat/ui-components";

import type { ReactNode } from "react";

export interface MacrostratDataProviderProps {
  baseURL?: string;
  store?: StoreApi<MacrostratStore>;
  children: React.ReactNode;
}

interface ColumnFootprintsStorage {
  project_id: ColumnProjectScope;
  // Whether the "in process" flag was used
  inProcess: boolean;
  // The column footprints
  columns: ColumnGeoJSONRecordWithID[];
}

interface RefsSlice {
  refs: Map<number, MacrostratRef>;
  /** Requests in flight, so duplicates can share one response */
  inFlightRequests: Map<string, Promise<Response>>;
  getRefs(ids: number[]): Promise<MacrostratRef[]>;
}

interface MacrostratStore extends RefsSlice {
  baseURL: string;
  fetch: any;
  lithologies: Map<number, any> | null;
  getLithologies(ids: number[] | null): Promise<any>;
  intervals: Map<number, any> | null;
  getIntervals(
    ids: number[] | null,
    timescaleID: number | null,
  ): Promise<Interval[]>;
  environments: Map<number, Environment> | null;
  getEnvironments(ids: number[] | null): Promise<Environment[]>;
  lithAttributes: Map<number, LithAttribute> | null;
  getLithAttributes(ids: number[] | null): Promise<LithAttribute[]>;
  timescales: Map<number, Timescale> | null;
  getTimescales(ids: number[] | null): Promise<Timescale[]>;
  /** Keyed by `columnScopeKey(projectID)`, not by a raw project id. */
  columnFootprints: Map<string, ColumnFootprintsStorage>;
  getColumns(
    projectID: ColumnProjectScope,
    inProcess: boolean,
  ): Promise<ColumnGeoJSONRecord[]>;
  // Strat names unify both "strat names" and "concepts"
  stratNames: Map<number, StratName> | null;
  getStratNames(ids: number[] | null): Promise<StratName[]>;
}

/** A lithology attribute definition, as `/defs/lithology_attributes` reports it. */
export interface LithAttribute {
  lith_att_id: number;
  name: string;
  /** What kind of attribute: `grains`, `bedform`, `sed structure`, `color`… */
  type?: string;
  t_units?: number;
}

/** A timescale, as `/defs/timescales` reports it (`timescale` is its name). */
export interface Timescale {
  timescale_id: number;
  timescale: string;
  n_intervals?: number;
  max_age?: number;
  min_age?: number;
  ref_id?: number;
}

const globalStoreMap = new Map<string, StoreApi<MacrostratStore>>();

export function createMacrostratStore(
  baseURL: string = "https://macrostrat.org/api/v2",
) {
  /* Check if there's already a store for this baseURL */
  if (globalStoreMap.has(baseURL)) {
    return globalStoreMap.get(baseURL);
  }

  return createStore<MacrostratStore>((set, get): MacrostratStore => {
    return {
      baseURL,
      inFlightRequests: new Map(),
      async fetch(url: string, options?: RequestInit) {
        /** Fetch function that shares a request already in flight */
        let url1 = url;
        if (!(url.startsWith("http://") || url.startsWith("https://"))) {
          url1 = baseURL + url;
        }

        // A duplicate request waits on the one in flight and reads a copy of
        // its response. Returning nothing instead — as this did — looks to the
        // caller exactly like a request that came back empty, and callers
        // cache that: a second ask for the same data while the first is still
        // open would leave whatever needed it permanently blank.
        const { inFlightRequests } = get();
        const pending = inFlightRequests.get(url1);
        if (pending != null) {
          const res = await pending;
          return res?.clone() ?? res;
        }

        // Every caller reads a clone, so the response this promise carries is
        // never consumed and stays safe to clone again
        const request = baseFetch(url1, options);
        inFlightRequests.set(url1, request);
        try {
          const res = await request;
          return res?.clone() ?? res;
        } finally {
          inFlightRequests.delete(url1);
        }
      },
      ...createLithologiesSlice(set, get),
      ...createIntervalsSlice(set, get),
      ...createEnvironmentsSlice(set, get),
      lithAttributes: null,
      getLithAttributes: definitionsGetter<LithAttribute>(
        set,
        get,
        "lithAttributes",
        fetchLithAttributes,
        (d) => d.lith_att_id,
      ),
      timescales: null,
      getTimescales: definitionsGetter<Timescale>(
        set,
        get,
        "timescales",
        fetchTimescales,
        (d) => d.timescale_id,
      ),
      ...createColumnsSlice(set, get),
      ...createRefsSlice(set, get),
      ...createStratNamesSlice(set, get),
    };
  });
}

function createRefsSlice(set: any, get: any) {
  return {
    refs: new Map(),
    async getRefs(ids: number[]): Promise<MacrostratRef[]> {
      const { refs, fetch } = get();
      const missing = ids.filter((id) => !refs.has(id));
      if (missing.length == 0) {
        return ids.map((id) => refs.get(id));
      }
      const data = await fetchRefs(missing, { fetch });
      if (data == null) return [];
      for (const d of data) {
        refs.set(d.ref_id, d);
      }
      set({ refs });
      return ids.map((id) => refs.get(id));
    },
  };
}

/** Cache key for a project scope. A list is order-insensitive so that
 * `[3, 1]` and `[1, 3]` share one entry. */
export function columnScopeKey(projectID: ColumnProjectScope): string {
  if (Array.isArray(projectID)) {
    return [...projectID].sort((a, b) => a - b).join(",");
  }
  return String(projectID);
}

/** Re-exported so consumers get the scope type from the same module as the
 * hooks that take it. */
export type { ColumnProjectScope };

function createColumnsSlice(set, get) {
  // Column footprints separated by project scope
  return {
    columnFootprints: new Map(),
    async getColumns(projectID: ColumnProjectScope, inProcess: boolean) {
      const { columnFootprints, fetch } = get();
      const key = columnScopeKey(projectID);

      let footprints = columnFootprints.get(key);
      if (footprints == null || footprints.inProcess != inProcess) {
        // Fetch the columns
        const statusCode: ColumnStatusCode[] = ["active"];
        if (inProcess) {
          statusCode.push("in process");
        }
        const columns = await fetchAllColumns({
          projectID,
          statusCode,
          fetch,
        });
        if (columns == null) {
          return;
        }
        footprints = {
          project_id: projectID,
          inProcess,
          columns,
        };
        // We could break multi-project result sets into separate caches here...
        // Copy the original map
        const columnFootprints2 = new Map(columnFootprints);
        columnFootprints2.set(key, footprints);
        set({ columnFootprints: columnFootprints2 });
      }
      return footprints.columns;
    },
  };
}

function createLithologiesSlice(set, get) {
  return {
    lithologies: null,
    async getLithologies(ids: number[] | null) {
      const { lithologies, fetch } = get();
      let lithMap = lithologies;
      if (lithMap == null) {
        const data = await fetchLithologies({ fetch });
        if (data == null) return;
        lithMap = new Map(data.map((d) => [d.lith_id, d]));
        set({ lithologies: lithMap });
      }
      // Now get the lithologies
      if (ids == null) return lithMap.values();
      return ids.map((id) => lithMap.get(id));
    },
  };
}

function createEnvironmentsSlice(set, get) {
  return {
    environments: null,
    async getEnvironments(ids: number[] | null): Promise<Environment[]> {
      const { environments, fetch } = get();
      let envMap = environments;
      if (envMap == null) {
        const data = await fetchEnvironments({ fetch });
        if (data == null) return [];
        envMap = new Map(data.map((d) => [d.environ_id, d]));
        set({ environments: envMap });
      }
      // Now get the environments
      if (ids == null) return envMap.values();
      return ids.map((id) => envMap.get(id));
    },
  };
}

/** The getter for a vocabulary fetched whole on first use and kept in the
 * store as a map by id, under `key`. */
function definitionsGetter<T>(
  set,
  get,
  key: string,
  fetcher: (opts: { fetch: any }) => Promise<T[] | null>,
  idOf: (d: T) => number,
) {
  return async (ids: number[] | null): Promise<T[]> => {
    const { fetch } = get();
    let defs: Map<number, T> | null = get()[key];
    if (defs == null) {
      const data = await fetcher({ fetch });
      if (data == null) return [];
      defs = new Map(data.map((d) => [idOf(d), d]));
      set({ [key]: defs });
    }
    if (ids == null) return Array.from(defs.values());
    return ids.map((id) => defs.get(id)) as T[];
  };
}

function createIntervalsSlice(set, get) {
  // One request per scope ("all", or a timescale id) while it is in flight,
  // so that the pickers mounting together — one per interval cell — share a
  // fetch and write the store once, rather than once each.
  const pending = new Map<string, Promise<boolean>>();

  /** Fetch a scope's intervals and merge them into the store. Resolves to
   * whether the fetch succeeded. */
  function loadIntervals(timescaleID: number | null): Promise<boolean> {
    const key = String(timescaleID ?? "all");
    const inFlight = pending.get(key);
    if (inFlight != null) return inFlight;
    const request = (async () => {
      let data: any[] | null;
      try {
        data = await fetchIntervals(timescaleID, { fetch: get().fetch });
      } finally {
        pending.delete(key);
      }
      if (data == null) return false;
      // Merge into whatever is in the store *now*, not into the snapshot
      // taken before the fetch. Several timescales are often requested at
      // once, and each request would otherwise start from the map as it was
      // before any of them resolved — so the last one to land drops the
      // others' intervals, and the timescales they recorded as fetched.
      set((state) => {
        const merged = new Map(state.intervals ?? []);
        for (const d of data) {
          merged.set(d.int_id, mergeInterval(merged.get(d.int_id), d));
        }
        let fetchedTimescales = state.fetchedTimescales;
        if (timescaleID != null) {
          fetchedTimescales = new Set(state.fetchedTimescales);
          fetchedTimescales.add(timescaleID);
        }
        // A request without a timescale is for every interval, so once it
        // lands nothing more needs fetching. Without recording that, every
        // call fetched them all again and replaced the store's map,
        // re-rendering everything that reads it.
        return {
          intervals: merged,
          fetchedAll: timescaleID == null || state.fetchedAll,
          fetchedTimescales,
        };
      });
      return true;
    })();
    pending.set(key, request);
    return request;
  }

  return {
    intervals: null,
    fetchedTimescales: new Set(),
    fetchedAll: false,
    async getIntervals(ids: number[] | null, timescaleID: number | null) {
      /** We can either fetch by timescale (if requesting a specific timescale)
       * or request all
       * */
      const { intervals, fetchedTimescales, fetchedAll } = get();
      let _intervals = intervals ?? new Map();

      let mustFetch = !fetchedAll;
      if (timescaleID != null) {
        mustFetch = !(fetchedAll || fetchedTimescales.has(timescaleID));
      }
      if (ids != null) {
        // If any ids are not found, we fetch all
        mustFetch = !(fetchedAll || ids.every((d) => _intervals.has(d)));
      }

      if (mustFetch) {
        const loaded = await loadIntervals(timescaleID);
        if (!loaded) return [];
        _intervals = get().intervals;
      }

      // Now, get the intervals
      if (ids != null) {
        return ids.map((id) => _intervals.get(id));
      } else if (timescaleID != null) {
        return Array.from(_intervals.values() as any[]).filter((d) =>
          intervalIsInTimescale(d, timescaleID),
        );
      } else {
        return Array.from(_intervals?.values() ?? []);
      }
    },
  };
}

/** Combine two records of the same interval.
 *
 * A request for one timescale reports only *that* timescale in each
 * interval's `timescales`, so records from different requests each know a
 * different part of the answer. Overwriting loses the rest: fetching the
 * Russian stages would quietly take the ICS ages that are also Russian stages
 * out of the international timescale, and the timescale drawn from it would
 * lose whole levels.
 */
function mergeInterval(existing: any, incoming: any) {
  if (existing == null) return incoming;
  const timescales = [...(existing.timescales ?? [])];
  for (const timescale of incoming.timescales ?? []) {
    const known = timescales.some(
      (d) => d.timescale_id === timescale.timescale_id,
    );
    if (!known) timescales.push(timescale);
  }
  return { ...existing, ...incoming, timescales };
}

function intervalIsInTimescale(interval: Interval, timescaleID: number) {
  return (
    interval.timescales?.some((t) => t.timescale_id === timescaleID) ?? false
  );
}

function createStratNamesSlice(set, get) {
  return {
    stratNames: null,
    async getStratNames(ids: number[] | null): Promise<StratName[]> {
      const { stratNames, fetch } = get();
      if (ids == null) {
        return stratNames?.values() ?? [];
      }
      let nameMap = stratNames ?? new Map();
      let stratNamesAlreadyLoaded: StratName[] = [];
      let stratNamesToLoad: number[] = [];
      for (const id of ids) {
        const nameForID = nameMap.get(id);
        if (nameForID != null) {
          stratNamesAlreadyLoaded.push(nameForID);
        } else {
          stratNamesToLoad.push(id);
        }
      }
      if (stratNamesToLoad.length > 0) {
        const data = await fetchStratNames(stratNamesToLoad, { fetch });
        if (data == null) return stratNamesAlreadyLoaded;
        for (const d of data) {
          nameMap.set(d.strat_name_id, d);
        }
        set({ stratNames: nameMap });
      }
      return ids.map((id) => nameMap.get(id));
    },
  };
}

export function useStratNames(ids: number[] | null) {
  const stratNames = useMemo(() => ids, ids ?? []);
  return useMacrostratData("strat_names", stratNames);
}

type MacrostratSelector = (store: MacrostratStore) => any;

export function useMacrostratStore(selector: MacrostratSelector | "api") {
  const ctx = useContext(MacrostratDataProviderContext);
  if (ctx == null) {
    throw new Error("Missing MacrostratDataProvider");
  }
  if (selector === "api") {
    return ctx;
  }
  return useStore(ctx, selector);
}

export function useMacrostratBaseURL(
  defaultURL = "https://macrostrat.org/api/v2",
): string {
  /** Get the Macrostrat base URL from the store if set, otherwise return a default value */
  const ctx = useContext(MacrostratDataProviderContext);
  if (ctx == null) {
    // Return default URL if no provider is present
    return defaultURL;
  }
  return ctx.getState().baseURL;
}

export function useMacrostratFetch() {
  const ctx = useContext(MacrostratDataProviderContext);
  if (ctx == null) {
    throw new Error("Missing MacrostratDataProvider");
  }
  return ctx.getState().fetch;
}

type DataTypeKey =
  | "lithologies"
  | "intervals"
  | "columns"
  | "environments"
  | "lithAttributes"
  | "timescales"
  | "refs"
  | "strat_names";

const dataTypeMapping = {
  lithologies: (store) => store.getLithologies,
  lithAttributes: (store) => store.getLithAttributes,
  timescales: (store) => store.getTimescales,
  intervals: (store) => store.getIntervals,
  columns: (store) => store.getColumns,
  environments: (store) => store.getEnvironments,
  refs: (store) => store.getRefs,
  strat_names: (store) => store.getStratNames,
};

export function useMacrostratDefs(
  dataType: string,
  ...args: any[]
): Map<number, any> | null {
  if (dataType == "columns") {
    throw new Error("Columns are not provided as a map");
  }
  const result = useMacrostratStore((state) => state[dataType]);
  const operator = useMacrostratStore(dataTypeMapping[dataType]);
  useEffect(() => {
    if (result != null) return;
    operator(...args);
  }, [result, operator, ...args]);
  return result;
}

export function useMacrostratColumns(
  projectID: ColumnProjectScope,
  inProcess: boolean,
) {
  const getColumns = useMacrostratStore((s) => s.getColumns);
  const columnsMap = useMacrostratStore((s) => s.columnFootprints);
  const key = columnScopeKey(projectID);
  const colData = columnsMap?.get(key);
  useEffect(() => {
    // Refetch if the columns are not available, or if we have requested inProcess columns where we didn't before
    if (colData == null || (inProcess && !colData.inProcess)) {
      getColumns(projectID, inProcess);
    }
    // If we've already fetched the columns there's nothing to do...
  }, [colData, inProcess, getColumns, key]);

  return useMemo(() => {
    if (colData == null) return null;
    const columns = colData.columns;
    if (inProcess || !colData.inProcess) return columns;
    // The cached set includes 'in process' columns but this caller doesn't want
    // them. `columns` is an array of features, so filter it and return a new
    // array — the previous version assigned to `columns.features`, which is
    // undefined on an array, so it both did nothing and mutated the cache.
    return columns.filter((d) => d.properties.status !== "in process");
  }, [colData, inProcess]);
}

export function useMacrostratColumnInfo(
  columnID: number,
): ColumnGeoJSONRecord["properties"] | null {
  /** Get basic info for a column, without automatically fetching it (assumes the overall set of relevant columns has already been fetched) */
  const columnsMap = useMacrostratStore((s) => s.columnFootprints);
  return useMemo(() => {
    for (const colData of columnsMap.values()) {
      const col = colData.columns.find((d) => d.properties.col_id === columnID);
      if (col != null) return col.properties;
    }
    return null;
  }, [columnsMap, columnID]);
}

export function useMacrostratData(dataType: DataTypeKey, ...args: any[]): any {
  const selector = dataTypeMapping[dataType];
  const operator = useMacrostratStore(selector);

  const [value, setValue] = useState(null);

  useEffect(() => {
    try {
      operator(...args).then(setValue);
    } catch (e) {
      console.error(e);
    }
  }, [operator, ...args]);

  return value;
}

/** By default, we provide a store linked to the production API */
const MacrostratDataProviderContext = createContext(createMacrostratStore());

export function MacrostratDataProvider(props: MacrostratDataProviderProps) {
  const {
    baseURL = "https://macrostrat.org/api/v2",
    store: _initStore,
    children,
  } = props;

  const store = useRef(_initStore ?? createMacrostratStore(baseURL));

  return h(MacrostratDataProviderContext.Provider, { value: store.current }, [
    h(_StoreAPIProvider, { children }),
  ]);
}

function _StoreAPIProvider({ children }) {
  const baseURL = useMacrostratStore((s) => s.baseURL);
  return h(MacrostratAPIProvider, { baseURL }, [children]);
}

/** Legacy API provider so useAPIResult can work */

type APIProviderProps = {
  children: ReactNode;
  useDev?: boolean;
  baseURL?: string;
};

export function MacrostratAPIProvider({
  children,
  useDev = false,
  baseURL,
}: APIProviderProps) {
  baseURL ??= useDev
    ? "https://dev.macrostrat.org/api/v2"
    : "https://macrostrat.org/api/v2";

  return h(
    APIProvider,
    {
      baseURL,
      unwrapResponse: (res) => res.success.data,
    },
    children,
  );
}

export function useLithologies() {
  const getLithologies = useMacrostratStore((s) => s.getLithologies);
  const lithologies = useMacrostratStore((s) => s.lithologies);
  useEffect(() => {
    if (lithologies == null) getLithologies();
  }, [lithologies, getLithologies]);
  return lithologies;
}

export function useEnvironments() {
  const getEnvironments = useMacrostratStore((s) => s.getEnvironments);
  const environments = useMacrostratStore((s) => s.environments);
  useEffect(() => {
    if (environments == null) getEnvironments();
  }, [environments, getEnvironments]);
  return environments;
}

export function useIntervals() {
  const getIntervals = useMacrostratStore((s) => s.getIntervals);
  const intervals = useMacrostratStore((s) => s.intervals);
  useEffect(() => {
    if (intervals == null) getIntervals();
  }, [getIntervals]);
  return intervals;
}

export function useLithAttributes() {
  const getLithAttributes = useMacrostratStore((s) => s.getLithAttributes);
  const lithAttributes = useMacrostratStore((s) => s.lithAttributes);
  useEffect(() => {
    if (lithAttributes == null) getLithAttributes(null);
  }, [lithAttributes, getLithAttributes]);
  return lithAttributes;
}

export function useTimescales() {
  const getTimescales = useMacrostratStore((s) => s.getTimescales);
  const timescales = useMacrostratStore((s) => s.timescales);
  useEffect(() => {
    if (timescales == null) getTimescales(null);
  }, [timescales, getTimescales]);
  return timescales;
}
