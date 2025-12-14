/** Data provider for information that needs to be loaded in bulk for frontend views */
import baseFetch from "cross-fetch";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import h from "@macrostrat/hyper";
import { create, useStore } from "zustand";
import {
  ColumnGeoJSONRecord,
  ColumnGeoJSONRecordWithID,
  Environment,
  MacrostratRef,
  StratName,
  Interval,
} from "@macrostrat/api-types";
import {
  fetchAllColumns,
  fetchEnvironments,
  fetchIntervals,
  fetchLithologies,
  fetchRefs,
  fetchStratNames,
  type ColumnStatusCode,
} from "./fetch";
import { APIProvider } from "@macrostrat/ui-components";
import { ColumnProvider } from "@macrostrat/column-components";

import { ReactNode } from "react";
import { useMacrostratColumnData } from "./store";

export interface MacrostratDataProviderProps {
  baseURL: string;
  children: React.ReactNode;
}

interface ColumnFootprintsStorage {
  project_id: number;
  // Whether the "in process" flag was used
  inProcess: boolean;
  // The column footprints
  columns: ColumnGeoJSONRecordWithID[];
}

interface RefsSlice {
  refs: Map<number, MacrostratRef>;
  inFlightRequests: Set<string>; // Track requests to avoid duplicates
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
  columnFootprints: Map<number, ColumnFootprintsStorage>;
  getColumns(
    projectID: number | null,
    inProcess: boolean,
  ): Promise<ColumnGeoJSONRecord[]>;
  // Strat names unify both "strat names" and "concepts"
  stratNames: Map<number, StratName> | null;
  getStratNames(ids: number[] | null): Promise<StratName[]>;
}

function createMacrostratStore(
  baseURL: string = "https://macrostrat.org/api/v2",
) {
  return create<MacrostratStore>((set, get): MacrostratStore => {
    return {
      baseURL,
      inFlightRequests: new Set(),
      async fetch(url: string, options?: RequestInit) {
        const url1 = baseURL + url;
        // Avoid duplicate requests
        const { inFlightRequests } = get();
        if (inFlightRequests.has(url1)) {
          return null; // Return null if already in flight
        }
        inFlightRequests.add(url1);
        //set({ inFlightRequests });
        const res = await baseFetch(url1, options);
        inFlightRequests.delete(url1);
        //set({in})
        return res;
      },
      ...createLithologiesSlice(set, get),
      ...createIntervalsSlice(set, get),
      ...createEnvironmentsSlice(set, get),
      ...createColumnsSlice(set, get),
      ...createRefsSlice(set, get),
      ...createStratNamesSlice(set, get),
    };
  });
}

function createRefsSlice(set, get) {
  return {
    refs: new Map(),
    async getRefs(ids: number[]): Promise<MacrostratRef[]> {
      const { refs, fetch } = get();
      const missing = ids.filter((id) => !refs.has(id));
      if (missing.length == 0) {
        return ids.map((id) => refs.get(id));
      }
      const data = await fetchRefs(missing, fetch);
      if (data == null) return [];
      for (const d of data) {
        refs.set(d.ref_id, d);
      }
      set({ refs });
      return ids.map((id) => refs.get(id));
    },
  };
}

function createColumnsSlice(set, get) {
  // Column footprints separated by project
  return {
    columnFootprints: new Map(),
    async getColumns(projectID: number | null, inProcess: boolean) {
      const { columnFootprints, baseURL, fetch } = get();
      const key = projectID ?? -1;
      let _inProcess = inProcess;

      let footprints = columnFootprints.get(key);
      if (footprints == null || footprints.inProcess != _inProcess) {
        // Fetch the columns
        const statusCode: ColumnStatusCode[] = ["active"];
        if (_inProcess) {
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
        const data = await fetchLithologies(fetch);
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
        const data = await fetchEnvironments(fetch);
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

function createIntervalsSlice(set, get) {
  return {
    intervals: null,
    async getIntervals(ids: number[] | null, timescaleID: number | null) {
      const { intervals, fetch } = get();
      let _intervals = intervals;
      if (intervals == null || !includesTimescale(intervals, timescaleID)) {
        // Fetch the intervals
        const data = await fetchIntervals(timescaleID, fetch);
        if (data == null) {
          return [];
        }
        const intervalMap = intervals ?? new Map();
        for (const d of data) {
          intervalMap.set(d.int_id, d);
        }
        _intervals = intervalMap;
        set({ intervals: _intervals });
      }
      if (ids == null && timescaleID == null)
        return Array.from(_intervals.values());
      if (timescaleID != null) {
        return Array.from(_intervals.values() as any[]).filter(
          (d) => d.timescale_id == timescaleID,
        );
      }
      return ids.map((id) => intervals.get(id));
    },
  };
}

function createStratNamesSlice(set, get) {
  return {
    stratNames: null,
    async getStratNames(ids: number[] | null): Promise<StratName[]> {
      const { stratNames, fetch } = get();
      let nameMap = stratNames ?? new Map();
      let stratNamesAlreadyLoaded = [];
      let stratNamesToLoad = [];
      for (const id of ids) {
        if (nameMap.has(id)) {
          stratNamesAlreadyLoaded.push(nameMap.get(id));
        } else {
          stratNamesToLoad.push(id);
        }
      }
      if (stratNamesToLoad.length > 0) {
        const data = await fetchStratNames(stratNamesToLoad, fetch);
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

function includesTimescale(intervals: Map<number, any>, timescaleID: number) {
  if (intervals == null) return false;
  if (timescaleID == null) return true;
  return Array.from(intervals.values()).some(
    (d) => d.timescale_id == timescaleID,
  );
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

type DataTypeKey =
  | "lithologies"
  | "intervals"
  | "columns"
  | "environments"
  | "refs"
  | "strat_names";

const dataTypeMapping = {
  lithologies: (store) => store.getLithologies,
  intervals: (store) => store.getIntervals,
  columns: (store) => store.getColumns,
  environments: (store) => store.getEnvironments,
  refs: (store) => store.getRefs,
  strat_names: (store) => store.getStratNames,
};

export function useMacrostratDefs(dataType: string): Map<number, any> | null {
  if (dataType == "columns") {
    throw new Error("Columns are not provided as a map");
  }
  const operator = useMacrostratStore(dataTypeMapping[dataType]);
  useEffect(() => {
    operator();
  }, []);
  return useMacrostratStore((state) => state[dataType]);
}

export function useMacrostratColumns(
  projectID: number | null,
  inProcess: boolean,
) {
  const getColumns = useMacrostratStore((s) => s.getColumns);
  const columnsMap = useMacrostratStore((s) => s.columnFootprints);
  const key = projectID ?? -1;
  const colData = columnsMap?.get(key);
  useEffect(() => {
    // Refetch if the columns are not available, or if we have requested inProcess columns where we didn't before
    if (colData == null || (inProcess && !colData.inProcess)) {
      getColumns(projectID, inProcess);
    }
    // If we've already fetched the columns there's nothing to do...
  }, [colData, inProcess, getColumns]);

  return useMemo(() => {
    if (colData == null) return null;
    let columns = colData.columns;
    if (!inProcess && colData.inProcess) {
      // Our available set of columns includes 'in process' columns, but we don't want them
      columns.features = columns.features?.filter(
        (d) => d.properties.status != "in process",
      );
    }
    return columns;
  }, [colData, inProcess]);
}

export function useMacrostratData(dataType: DataTypeKey, ...args: any[]) {
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
  const { baseURL = "https://dev.macrostrat.org/api/v2", children } = props;

  const [store] = useState(() => createMacrostratStore(baseURL));

  return h(
    MacrostratAPIProvider,
    { baseURL },
    h(MacrostratDataProviderContext.Provider, { value: store }, children),
  );
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

export function MacrostratColumnProvider(props) {
  /** A column provider specialized the Macrostrat API. Maps more
   * generic concepts to Macrostrat-specific ones.
   */

  const { axisType } = useMacrostratColumnData();
  const { units, domain, pixelScale, scale, children } = props;
  return h(
    ColumnProvider,
    {
      axisType,
      divisions: units,
      range: domain,
      pixelsPerMeter: pixelScale,
      scale,
    },
    children,
  );
}

/** This is now a legacy provider */
export function LithologiesProvider({ children }) {
  useEffect(() => {
    console.warn(
      "LithologiesProvider is deprecated. Replace with MacrostratDataProvider",
    );
  }, []);
  return children;
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
