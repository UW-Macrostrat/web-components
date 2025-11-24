import { group, InternMap } from "d3-array";
import {
  createAPIContext,
  useAPIResult,
  useAsyncMemo,
} from "@macrostrat/ui-components";

const responseUnwrapper = (d) => d.records;

const pbdbAPIContext = createAPIContext({
  baseURL: "https://paleobiodb.org/data1.2",
  unwrapResponse: responseUnwrapper,
});

export enum FossilDataType {
  Occurrences = "occs",
  Collections = "colls",
}

export function usePBDBFossilData(
  type: FossilDataType,
  { col_id },
): any[] | null {
  const params = {
    ms_column: col_id,
    show: "full,mslink",
  };
  return useAPIResult(`/${type}/list.json`, params, {
    context: pbdbAPIContext,
  });
}

export interface PBDBIdentifier {
  unit_id: number;
  col_id: number;
  cltn_id: number;
}

export interface PBDBCollection extends PBDBIdentifier {
  cltn_name: string;
  pbdb_occs: number;
  t_age: number;
  b_age: number;
  [key: string]: any; // Allow for additional properties
}

export interface PBDBOccurrence extends PBDBIdentifier {
  occ_id: number;
  cltn_id: number;
  taxon_name: string;
  best_name: string;
  [key: string]: any; // Allow for additional properties
}

export function useFossilData(
  col_id: number,
  type = FossilDataType.Collections,
) {
  // Fossil links are stored in both Macrostrat and PBDB, depending on how the link was assembled. Here
  // we create a unified view of data over both sources.
  return useAsyncMemo(async () => {
    if (col_id == null) return null;
    return await fetchFossilData(col_id, type);
  }, [col_id, type]);
}

async function fetchMacrostratFossilData(
  col_id: number,
  type: FossilDataType,
): Promise<PBDBCollection[]> {
  if (type !== FossilDataType.Collections) {
    // Macrostrat API only supports collections
    return [];
  }

  // Fetch fossil collections linked to columns from the Macrostrat API
  const resp = await fetch(
    `https://macrostrat.org/api/fossils?col_id=${col_id}`,
  );
  const res = await resp.json();
  // Create collections from Macrostrat data
  return res.success.data;
}

async function fetchPDBDFossilData(
  col_id: number,
  type: FossilDataType,
): Promise<PBDBCollection[]> {
  const resp = await fetch(
    `https://paleobiodb.org/data1.2/${type}/list.json?ms_column=${col_id}&show=mslink,full`,
  );
  const res = await resp.json();
  return res.records.map(
    type == FossilDataType.Collections
      ? createMacrostratCollection
      : preprocessOccurrence,
  );
}

async function fetchFossilData(
  colID: number,
  type: FossilDataType,
): Promise<InternMap<number, PBDBOccurrence[] | PBDBCollection[]>> {
  const [macrostratData, pbdbData] = await Promise.all([
    fetchMacrostratFossilData(colID, type),
    fetchPDBDFossilData(colID, type),
  ]);

  const data = [...macrostratData, ...pbdbData];

  return group(data, (d) => d.unit_id);
}

function preprocessOccurrence(d): PBDBOccurrence {
  /* Preprocess data for an occurrence into a Macrostrat-like format */
  // Standardize names of Macrostrat units and columns
  const unit_id = parseInt(d.msu.replace(/^\w+:/, ""));
  const col_id = parseInt(d.msc.replace(/^\w+:/, ""));

  // taxon names may be stored in different fields
  const occ_id = parseInt(d.oid.replace(/^occ:/, ""));
  const cltn_id = parseInt(d.cid.replace(/^col:/, ""));

  return {
    ...d,
    unit_id,
    col_id,
    taxon_name: d.tna,
    best_name: d.idn ?? d.tna,
    occ_id,
    cltn_id,
    cltn_name: d.nam,
  };
}

function createMacrostratCollection(d): PBDBCollection {
  /* Preprocess data for a collection into a Macrostrat-like format */
  let unit_id = null;
  let col_id = null;
  // Standardize names of Macrostrat units and columns
  if (d.msu != null) {
    unit_id = parseInt(d.msu.replace(/^\w+:/, ""));
  }
  if (d.msc != null) {
    col_id = parseInt(d.msc.replace(/^\w+:/, ""));
  }

  // taxon names may be stored in different fields
  let taxon_name = d.tna;
  let occ_id = null;
  if (d.oid != null && d.oid.startsWith("occ:")) {
    occ_id = parseInt(d.oid.replace(/^occ:/, ""));
  }
  if (d.idn != null) {
    taxon_name = d.idn;
  }

  let cltn_id = d.cltn_id;
  if (d.oid != null && d.oid.startsWith("col:")) {
    cltn_id = parseInt(d.oid.replace(/^col:/, ""));
  } else if (d.cid != null && d.cid.startsWith("col:")) {
    cltn_id = parseInt(d.cid.replace(/^col:/, ""));
  }

  return {
    ...d,
    unit_id,
    col_id,
    taxon_name,
    occ_id,
    cltn_id,
    cltn_name: d.nam,
    t_age: d.t_age,
    b_age: d.b_age,
  };
}
