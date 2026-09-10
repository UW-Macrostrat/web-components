import {
  CORE_COLUMNS_PROJECT_ID,
  ColumnProjectScope,
  ColumnStatusCode,
  fetchAllColumns,
  useMacrostratFetch,
} from "@macrostrat/data-provider";
import { useAsyncMemo } from "@macrostrat/ui-components";

export function useColumnFeatures({
  status_code,
  project_id,
  format = "geojson",
}: {
  apiRoute?: string;
  status_code?: string;
  /** Which projects to fetch. Defaults to the "Core columns" composite, which
   * is what the API used to apply implicitly. */
  project_id?: ColumnProjectScope;
  format?: "geojson" | "topojson" | "geojson_bare";
}) {
  /** Legacy fetcher for column features */
  const fetch = useMacrostratFetch();

  let statusCode: ColumnStatusCode[] = ["active"];
  if (status_code == "in process") {
    statusCode.push("in process");
  }

  return useAsyncMemo(async () => {
    return await fetchAllColumns({
      projectID: project_id ?? CORE_COLUMNS_PROJECT_ID,
      statusCode: statusCode,
      format,
      fetch,
    });
  }, [project_id, status_code, format]);
}
