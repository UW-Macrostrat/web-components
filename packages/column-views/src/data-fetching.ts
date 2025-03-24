import type { ColumnGeoJSONRecord } from "@macrostrat/api-types";
import {
  addQueryString,
  joinURL,
  useAPIResult,
} from "@macrostrat/ui-components";
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
  if (projectID != null || statusCode != null) {
    args = { ...args, project_id: projectID, status_code: statusCode };
  } else {
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
  return processors[format](data);
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

  const processor = processors[format];

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
    return convertSmallAreasToPoints(removeFeaturesWithoutGeometry(f));
  } catch (err) {
    console.error(err);
    return [];
  }
}

function removeFeaturesWithoutGeometry(features) {
  return features.filter((f) => f.geometry != null);
}

function convertSmallAreasToPoints(features) {
  return features.map((f) => {
    if (geoArea(f.geometry) < 1e-8) {
      const centroid = geoCentroid(f.geometry);
      f.geometry = {
        type: "Point",
        coordinates: centroid,
      };
    }
    return f;
  });
}

const processors = {
  topojson: processTopoJSON,
  geojson: processGeoJSON,
  geojson_bare: processGeoJSONBare,
};
