import { group } from "d3-array";
import { createAPIContext, useAPIResult } from "@macrostrat/ui-components";

const responseUnwrapper = (d) => d.records;

const pbdbAPIContext = createAPIContext({
  baseURL: "https://training.paleobiodb.org/data1.2",
  unwrapResponse: responseUnwrapper,
});

export enum FossilDataType {
  Occurrences = "occs",
  Collections = "colls",
}

export function usePBDBFossilData(type: FossilDataType, { col_id }) {
  const params = {
    ms_column: col_id,
    show: "full,mslink",
  };
  return useAPIResult(`/${type}/list.json`, params, {
    context: pbdbAPIContext,
  });
}

export interface PBDBCollection {
  unit_id: number;
  col_id: number;
  cltn_id: number;
  cltn_name: string;
  pbdb_occs: number;
  t_age: number;
  b_age: number;
  [key: string]: any; // Allow for additional properties
}

function useMacrostratFossilData({ col_id }): PBDBCollection[] | null {
  return useAPIResult("/fossils", { col_id });
}

function createMacrostratCollection(d): PBDBCollection {
  let unit_id = null;
  let col_id = null;
  // Standardize names of Macrostrat units and columns
  if (d.msu !== null) {
    unit_id = parseInt(d.msu.replace(/^\w+:/, ""));
  }
  if (d.msc !== null) {
    col_id = parseInt(d.msc.replace(/^\w+:/, ""));
  }

  return {
    ...d,
    unit_id,
    col_id,
    cltn_id: parseInt(d.oid.replace(/^col:/, "")),
    cltn_name: d.nam,
    t_age: d.t_age,
    b_age: d.b_age,
  };
}

export function useFossilData({ col_id }) {
  // Fossil links are stored in both Macrostrat and PBDB, depending on how the link was assembled. Here
  // we create a unified view of data over both sources.

  const r1 = usePBDBFossilData(FossilDataType.Collections, { col_id });

  const r2 = useMacrostratFossilData({ col_id });

  if (r1 == null || r2 == null) return null;
  const r1a = r1.map(createMacrostratCollection);

  const data = [...r1a, ...r2];

  return group(data, (d) => d.unit_id);
}
