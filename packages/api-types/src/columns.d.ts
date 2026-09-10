import { Polygon, MultiPolygon, Point } from "geojson";

export type ColumnSpec = {
  col_id: number | string;
  status_code?: string;
  project_id?: number;
};

export type ColumnProperties = {
  col_id: number;
  col_area: string;
  col_name: string;
  col_group?: string;
  col_group_id?: number;
  project_id: number;
  group_col_id?: number;
  col_type?: "column" | "section";
  /** The column's editorial state. Added to `/columns` in API v2 2.3.10, so it
   * is absent from older API deployments. */
  status?: ColumnStatusCode;
};

export type ColumnStatusCode = "in process" | "active" | "obsolete";

export interface ColumnGeoJSONRecord {
  type: "Feature";
  geometry: Polygon | MultiPolygon | Point;
  properties: ColumnProperties;
}

export interface ColumnGeoJSONRecordWithID extends ColumnGeoJSONRecord {
  id: number;
}
