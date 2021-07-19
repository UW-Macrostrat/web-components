import axios from "axios";
import { IUnit } from "common/units";

export interface ColumnSpec {
  col_id: number;
  status_code?: string;
  project_id?: number;
}

export function referenceMeasurementsToColumn(
  measurementData: any[],
  columnUnits?: IUnit[],
  targetColumnParams = {}
) {
  let data = [];
  if (columnUnits == null) return measurementData;
  for (const meas of measurementData) {
    // First, find based on exact match (this is basically a no-op)
    // Then, find based on the stratigraphic name
    let unit =
      columnUnits.find(u => u.unit_id === meas.unit_id) ??
      columnUnits.find(u => u.strat_name_id === meas.strat_name_id);
    if (unit != null) {
      const { unit_id } = unit;
      data.push({
        ...meas,
        unit_id,
        ...targetColumnParams
      });
    }
  }
  return data;
}

export async function buildMacrostratMeasurements(
  apiBaseURL: string,
  sourceColumn: ColumnSpec,
  targetColumn: ColumnSpec
) {
  // Get the measurements associated with the medium column

  const { data: res } = await axios.get(apiBaseURL + "/measurements", {
    params: {
      ...sourceColumn,
      show_values: true,
      response: "long"
    }
  });

  // get all the units in the macrostrat column
  const { data: units } = await axios.get(apiBaseURL + "/units", {
    params: { ...targetColumn }
  });

  const data = referenceMeasurementsToColumn(
    res.success?.data ?? [],
    units.success?.data,
    targetColumn
  );

  let res2 = { ...res };
  res2.success.data = data;

  return res2;
}
