import axios from "axios";
import { ColumnSpec } from "@macrostrat/api-types";
import { alignMeasurementsToTargetColumn } from "@macrostrat/api-utils";

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

  const data = alignMeasurementsToTargetColumn(
    res.success?.data ?? [],
    units.success?.data,
    targetColumn
  );

  let res2 = { ...res };
  res2.success.data = data;

  return res2;
}
