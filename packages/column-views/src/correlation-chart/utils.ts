import { Point } from "geojson";
import type { ColumnGeoJSONRecord } from "@macrostrat/api-types";
import { ColumnIdentifier } from "./types";
import { UnitLong } from "@macrostrat/api-types";

export async function getCorrelationUnits(
  focusedColumns: FocusedColumnGeoJSONRecord[]
) {
  const columnIDs = focusedColumns.map(columnGeoJSONRecordToColumnIdentifier);
  return await fetchAllColumnUnits(columnIDs);
}

type ColumnData = {
  units: UnitLong[];
  columnID: number;
};

async function fetchUnitsForColumn(col_id: number): Promise<ColumnData> {
  const url = "https://macrostrat.org/api/v2/units";
  const params = new URLSearchParams();
  params.append("response", "long");
  params.append("col_id", col_id.toString());
  const res = await fetch(url + "?" + params.toString());
  const data = await res.json();
  if (!data.success) {
    throw new Error("Failed to fetch column units");
  }
  const units = data.success.data;
  return { columnID: col_id, units };
}

export async function fetchAllColumnUnits(
  columns: ColumnIdentifier[]
): Promise<ColumnData[]> {
  const promises = columns.map((col) => fetchUnitsForColumn(col.col_id));
  return await Promise.all(promises);
}

interface FocusedColumnGeoJSONRecord extends ColumnGeoJSONRecord {
  properties: {
    centroid: Point;
    nearestPointOnLine: Point;
    distanceAlongLine: number;
  } & ColumnGeoJSONRecord["properties"];
}

export function columnGeoJSONRecordToColumnIdentifier(
  col: ColumnGeoJSONRecord
): ColumnIdentifier {
  return {
    col_id: col.properties.col_id,
    col_name: col.properties.col_name,
    project_id: col.properties.project_id,
  };
}
