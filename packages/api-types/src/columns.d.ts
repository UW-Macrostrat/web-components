import { Polygon, MultiPolygon } from "geojson";

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
};

export interface ColumnGeoJSONRecord {
  type: "Feature";
  geometry: Polygon | MultiPolygon;
  properties: ColumnProperties;
}

export interface ColumnGeoJSONRecordWithID extends ColumnGeoJSONRecord {
  id: number;
}
