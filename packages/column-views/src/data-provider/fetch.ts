import {
  ColumnGeoJSONRecord,
  MacrostratRef,
  UnitLong,
} from "@macrostrat/api-types";
import {
  addQueryString,
  joinURL,
  useAPIResult,
} from "@macrostrat/ui-components";
import crossFetch from "cross-fetch";
import { feature } from "topojson-client";
import { geoArea } from "d3-geo";

function defaultFetch(url: string, options: RequestInit) {
  const baseURL = "https://macrostrat.org/api/v2";
  return crossFetch(baseURL + url, options);
}

export interface ColumnFetchOptions {
  apiBaseURL?: string;
  projectID?: number;
  statusCode?: "in process";
  format?: "geojson" | "topojson" | "geojson_bare";
  fetch?: any;
}

export async function fetchAllColumns(
  options: ColumnFetchOptions = {}
): Promise<ColumnGeoJSONRecord[]> {
  const {
    apiBaseURL,
    projectID,
    format = "topojson",
    statusCode,
    fetch = crossFetch,
  } = options;

  let args: any = { format };
  if (projectID != null) {
    args = { ...args, project_id: projectID };
  }
  if (statusCode != null) {
    args = { ...args, status_code: statusCode };
  }

  if (projectID == null) {
    args = { ...args, all: true };
  }

  let url = "/columns";
  if (apiBaseURL != null) {
    url = joinURL(apiBaseURL, url);
  }

  // Try with fetch
  url = addQueryString(url, args);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (res == null) {
    return null;
  }

  // Get JSON
  const data = await res.json();
  return postProcessColumns(columnProcessors[format](data));
}

export function useColumnFeatures({
  apiRoute = "/columns",
  status_code,
  project_id,
  format = "geojson",
}) {
  let all: boolean = undefined;
  if (status_code == null && project_id == null) {
    all = true;
  }

  const processor = columnProcessors[format];

  return useAPIResult(
    apiRoute,
    { format, all, status_code, project_id },
    processor
  );
}

function processGeoJSON(res) {
  return processGeoJSONBare(res?.success?.data);
}

function processGeoJSONBare(res) {
  return res?.features;
}

function processTopoJSON(res) {
  try {
    const { data } = res.success;
    const { features: f } = feature(data, data.objects.output) as any;
    return f;
  } catch (err) {
    console.error(err);
    return [];
  }
}

function postProcessColumns(columns) {
  return promoteColumnIDs(
    convertSmallAreasToPoints(removeFeaturesWithoutGeometry(columns))
  );
}

function promoteColumnIDs(
  features: ColumnGeoJSONRecord[]
): ColumnGeoJSONRecordWithIDs[] {
  return features.map((f, i) => {
    return {
      id: f.properties?.col_id,
      ...f,
    };
  });
}

function removeFeaturesWithoutGeometry(features) {
  return features.filter((f) => f.geometry != null);
}

function convertSmallAreasToPoints(features) {
  return features.map((f) => {
    // GeoArea takes a long time to run. We are really more worried about points that are zero-area
    if (geoArea(f.geometry) < 1e-8) {
      const centroid = f.geometry.coordinates[0][0];
      f.geometry = {
        type: "Point",
        coordinates: centroid,
      };
    }
    return f;
  });
}

const columnProcessors = {
  topojson: processTopoJSON,
  geojson: processGeoJSON,
  geojson_bare: processGeoJSONBare,
};

async function unwrapResponse(res) {
  if (res == null) {
    return null;
  }
  const resData = await res.json();
  return resData["success"]["data"];
}

export async function fetchLithologies(fetch = defaultFetch) {
  const res = await fetch("/defs/lithologies?all");
  return await unwrapResponse(res);
}

export async function fetchIntervals(
  timescaleID: number | null,
  fetch = defaultFetch
) {
  let url = `/defs/intervals`;
  if (timescaleID != null) {
    url += `?timescale_id=${timescaleID}`;
  } else {
    url += "?all";
  }
  const res = await fetch(url);
  return await unwrapResponse(res);
}

export async function fetchEnvironments(fetch = defaultFetch) {
  const res = await fetch("/defs/environments?all");
  return await unwrapResponse(res);
}

export async function fetchRefs(
  refs: number[],
  fetch = defaultFetch
): Promise<MacrostratRef[]> {
  let url = `/defs/refs`;
  if (refs.length == 0) {
    return [];
  }
  url += "?ref_id=" + refs.join(",");
  const res = await fetch(url);
  return await unwrapResponse(res);
}

export type ColumnData = {
  units: UnitLong[];
  columnID: number;
};

export async function fetchUnits(
  columns: number[],
  fetch = defaultFetch
): Promise<ColumnData[]> {
  const promises = columns.map((col_id) => fetchColumnUnits(col_id, fetch));
  return await Promise.all(promises);
}

export async function fetchColumnUnits(
  col_id: number,
  fetch = defaultFetch
): Promise<ColumnData> {
  const params = new URLSearchParams();
  params.append("response", "long");
  params.append("col_id", col_id.toString());
  const res = await fetch("/units" + "?" + params.toString());
  const data = await res.json();
  if (!data.success) {
    throw new Error("Failed to fetch column units");
  }
  const units = data.success.data;
  return { columnID: col_id, units };
}
