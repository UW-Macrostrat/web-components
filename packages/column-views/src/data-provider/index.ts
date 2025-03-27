/** Data provider for information that needs to be loaded in bulk for frontend views */

import { createContext, useContext, useEffect, useState } from "react";
import h from "@macrostrat/hyper";
import { create, useStore } from "zustand";
import {
  ColumnGeoJSONRecord,
  Environment,
  MacrostratRef,
} from "@macrostrat/api-types";
import {
  fetchAllColumns,
  fetchEnvironments,
  fetchIntervals,
  fetchLithologies,
  fetchRefs,
} from "./fetch";
export * from "./fetch";

interface MacrostratDataProviderProps {
  baseURL: string;
  children: React.ReactNode;
}

interface ColumnFootprintsStorage {
  project_id: number;
  // Whether the "in process" flag was used
  inProcess: boolean;
  // The column footprints
  columns: ColumnGeoJSONRecord[];
}

interface RefsSlice {
  refs: Map<number, MacrostratRef>;
  getRefs(ids: number[]): MacrostratRef[];
}

interface MacrostratStore extends RefsSlice {
  baseURL: string;
  lithologies: Map<number, any> | null;
  getLithologies(ids: number[] | null): Promise<any>;
  intervals: Map<number, any> | null;
  getIntervals(ids: number[] | null, timescaleID: number | null): Promise<any>;
  environments: Map<number, Environment> | null;
  getEnvironments(ids: number[] | null): Promise<Environment[]>;
  columnFootprints: Map<number, ColumnFootprintsStorage>;
  getColumns(
    projectID: number | null,
    inProcess: boolean
  ): Promise<ColumnGeoJSONRecord[]>;
}

function createMacrostratStore(
  baseURL: string = "https://macrostrat.org/api/v2"
) {
  return create<MacrostratStore>((set, get): MacrostratStore => {
    return {
      baseURL,
      ...createLithologiesSlice(set, get),
      ...createIntervalsSlice(set, get),
      ...createEnvironmentsSlice(set, get),
      ...createColumnsSlice(set, get),
      ...createRefsSlice(set, get),
    };
  });
}

function createRefsSlice(set, get) {
  return {
    refs: new Map(),
    async getRefs(ids: number[]): Promise<MacrostratRef[]> {
      const { refs, baseURL } = get();
      const missing = ids.filter((id) => !refs.has(id));
      if (missing.length == 0) {
        return ids.map((id) => refs.get(id));
      }
      const data = await fetchRefs(baseURL, missing);
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
      const { columnFootprints, baseURL } = get();
      const key = projectID ?? -1;
      let footprints = columnFootprints.get(key);
      if (footprints == null || footprints.inProcess != inProcess) {
        // Fetch the columns
        const statusCode = inProcess ? "in process" : null;
        const columns = await fetchAllColumns({
          apiBaseURL: baseURL,
          projectID,
          statusCode,
        });
        footprints = {
          project_id: projectID,
          inProcess,
          columns,
        };
        // We could break multi-project result sets into separate caches here...
        columnFootprints.set(key, footprints);
        set({ columnFootprints });
      }
      return footprints.columns;
    },
  };
}

function createLithologiesSlice(set, get) {
  return {
    lithologies: null,
    async getLithologies(ids: number[] | null) {
      const { lithologies, baseURL } = get();
      let lithMap = lithologies;
      if (lithMap == null) {
        const data = await fetchLithologies(baseURL);
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
      const { environments, baseURL } = get();
      let envMap = environments;
      if (envMap == null) {
        const data = await fetchEnvironments(baseURL);
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
      const { intervals, baseURL } = get();
      let _intervals = intervals;
      if (intervals == null || !includesTimescale(intervals, timescaleID)) {
        // Fetch the intervals
        const data = await fetchIntervals(baseURL, timescaleID);
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
        return Array.from(_intervals.values()).filter(
          (d) => d.timescale_id == timescaleID
        );
      }
      return ids.map((id) => intervals.get(id));
    },
  };
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

const dataTypeMapping = {
  lithologies: (store) => store.getLithologies,
  intervals: (store) => store.getIntervals,
  columns: (store) => store.getColumns,
  environments: (store) => store.getEnvironments,
  refs: (store) => store.getRefs,
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

export function useMacrostratData(dataType: string, ...args: any[]) {
  const selector = dataTypeMapping[dataType];
  const operator = useMacrostratStore(selector);

  const [value, setValue] = useState(null);

  useEffect(() => {
    operator(...args).then(setValue);
  }, [operator, ...args]);

  return value;
}

/** By default, we provide a store linked to the production API */
const MacrostratDataProviderContext = createContext(createMacrostratStore());

export function MacrostratDataProvider(props: MacrostratDataProviderProps) {
  const { baseURL, children } = props;
  const [store] = useState(() => createMacrostratStore(baseURL));

  return h(MacrostratDataProviderContext.Provider, { value: store }, children);
}

function includesTimescale(intervals: Map<number, any>, timescaleID: number) {
  if (intervals == null) return false;
  if (timescaleID == null) return true;
  return Array.from(intervals.values()).some(
    (d) => d.timescale_id == timescaleID
  );
}
