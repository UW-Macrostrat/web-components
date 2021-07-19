import { MeasurementDataProvider } from "apps/carbon-isotopes/data-provider";
import { MeasurementLong } from "@macrostrat/api-types";

const keys = [
  "measure_value",
  "measure_error",
  "measure_position",
  "measure_n",
  "sample_no"
];

export function filterMeasurements(
  meas: MeasurementLong
): MeasurementLong | null {
  let data = {};
  for (const key of keys) {
    data[key] = [];
  }

  for (const i in meas.measure_value) {
    if (meas.sample_no[i].match(/^G3-/)) {
      for (const key of keys) {
        data[key].push(meas[key][i]);
      }
    }
  }
  if (data.measure_value.length == 0) return null;
  return { ...meas, ...data };
}
