import type { ColumnGeoJSONRecord } from "@macrostrat/api-types";

export async function fetchAllColumns(
  base: string
): Promise<ColumnGeoJSONRecord[]> {
  // Try with fetch
  const url = addQueryString(joinURL(base, "/columns"), {
    format: "geojson_bare",
    all: "true",
  });

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Get JSON
  const data = await res.json();
  return data.features;
}

export function joinURL(...args) {
  let newURL = args[0];
  for (let i = 1; i < args.length; i++) {
    newURL = newURL.replace(/\/$/, "") + "/" + args[i].replace(/^\//, "");
  }
  return newURL;
}

export function addQueryString(url: string, params: any) {
  // If params is already urlsearchparams, just append
  let p1: URLSearchParams;
  if (params instanceof URLSearchParams) {
    p1 = params;
  } else {
    p1 = new URLSearchParams(params);
  }
  return url + "?" + p1.toString();
}
