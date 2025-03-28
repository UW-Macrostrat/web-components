import type { ColumnGeoJSONRecord, MacrostratRef } from "@macrostrat/api-types";
import {
  addQueryString,
  joinURL,
  useAPIResult,
} from "@macrostrat/ui-components";
import fetch from "cross-fetch";
import { feature } from "topojson-client";
import { geoArea, geoCentroid } from "d3-geo";

export interface ColumnFetchOptions {
  apiBaseURL?: string;
  projectID?: number;
  statusCode?: "in process";
  format?: "geojson" | "topojson" | "geojson_bare";
}

export async function fetchAllColumns(
  options: ColumnFetchOptions = {}
): Promise<ColumnGeoJSONRecord[]> {
  const { apiBaseURL, projectID, format = "topojson", statusCode } = options;

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

  // Try with fetch
  const url = addQueryString(joinURL(apiBaseURL, "/columns"), args);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Get JSON
  const data = await res.json();
  return postProcessColumns(columnProcessors[format](data));
}

export function useColumnData({
  apiRoute = "/columns",
  status_code,
  project_id,
  format = "topojson",
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

function promoteColumnIDs(features) {
  return features.map((f, i) => {
    /** col_id property should be promoted to top level in order to be used as GeoJSON-compliant unique identifier */
    if (f.properties.col_id != null && f.id == null) {
      f.id = f.properties.col_id;
    }
    return f;
  });
}

function removeFeaturesWithoutGeometry(features) {
  return features.filter((f) => f.geometry != null);
}

function convertSmallAreasToPoints(features) {
  return features.map((f) => {
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

export async function fetchLithologies(baseURL: string) {
  const res = await fetch(baseURL + "/defs/lithologies?all");
  const resData = await res.json();
  return resData["success"]["data"];
}

export async function fetchIntervals(
  baseURL: string,
  timescaleID: number | null
) {
  let url = `${baseURL}/defs/intervals`;
  if (timescaleID != null) {
    url += `?timescale_id=${timescaleID}`;
  } else {
    url += "?all";
  }
  const res = await fetch(url);
  const resData = await res.json();
  return resData["success"]["data"];
}

export async function fetchEnvironments(baseURL: string) {
  const res = await fetch(baseURL + "/defs/environments?all");
  const resData = await res.json();
  return resData["success"]["data"];
}

export async function fetchRefs(
  baseURL: string,
  refs: number[]
): Promise<MacrostratRef[]> {
  let url = `${baseURL}/defs/refs`;
  if (refs.length == 0) {
    return [];
  }
  url += "?ref_id=" + refs.join(",");
  const res = await fetch(url);

  const resData = await res.json();
  return resData["success"]["data"];
}
