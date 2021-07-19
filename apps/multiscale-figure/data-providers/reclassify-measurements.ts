import axios from "axios";

export interface ColumnSpec {
  col_id: number;
  status_code?: string;
  project_id?: number;
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

  let data = [];

  // get all the units in the macrostrat column
  const { data: units } = await axios.get(apiBaseURL + "/units", {
    params: { ...targetColumn }
  });

  const unitData = units.success?.data;
  if (unitData == null) return res;

  for (const meas of res.success?.data ?? []) {
    // First, find based on exact match (this is basically a no-op)
    // Then, find based on the stratigraphic name
    let unit =
      unitData.find(u => u.unit_id === meas.unit_id) ??
      unitData.find(u => u.strat_name_id === meas.strat_name_id);
    if (unit != null) {
      const { unit_id } = unit;
      data.push({ ...meas, unit_id, ...targetColumn });
      console.log(meas, unit, unit_id);
    }
  }

  let res2 = { ...res };
  res2.success.data = data;

  return res2;
}
