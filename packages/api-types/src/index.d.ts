//export * from "./columns.d";
export * from "./measurements.d";
export * from "./units.d";

export type ColumnSpec = {
  col_id: number | string;
  status_code?: string;
  project_id?: number;
};
