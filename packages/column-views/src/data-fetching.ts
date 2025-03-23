import type { ColumnGeoJSONRecord } from "@macrostrat/api-types";
import { addQueryString, joinURL } from "@macrostrat/ui-components";

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
