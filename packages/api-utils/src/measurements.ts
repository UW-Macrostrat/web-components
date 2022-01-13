import {
  BaseUnit,
  MeasurementLong,
  ColumnSpec,
  StratUnit
} from "@macrostrat/api-types";

/* Reference measurements with relative heights to absolute age datum in column units.
This produces data that can be plotted on column-based axes. */
export function referenceMeasuresToColumn(
  units: BaseUnit[],
  measures: MeasurementLong[]
): MeasurementLong[] {
  /** Add a `measure_age` parameter containing absolute ages derived from units. */
  const ids = units.map(d => d.unit_id);
  const colMeasures = measures.filter(d => ids.includes(d.unit_id));

  return colMeasures.map(measure => {
    const unit = units.find(u => u.unit_id == measure.unit_id);

    const unitAgeSpan = unit.b_age - unit.t_age;

    const measure_age = measure.measure_position.map(pos => {
      return (pos / 100) * unitAgeSpan + unit.t_age;
    });

    return { measure_age, ...measure };
  });
}

/** Align measurements potentially taken from different columns to the units
 * within a single column. */
export function alignMeasurementsToTargetColumn<T extends StratUnit>(
  measurementData: MeasurementLong[],
  targetColumnUnits?: T[],
  targetColumnParams?: ColumnSpec
): MeasurementLong[] {
  let data = [];
  if (targetColumnUnits == null) return measurementData;
  for (const meas of measurementData) {
    /* First, find based on exact match (this is usually
      basically a no-op, since most units are specific to columns)
      Then, find based on the stratigraphic name */
    let unit =
      targetColumnUnits.find(u => u.unit_id === meas.unit_id) ??
      targetColumnUnits.find(u => u.strat_name_id === meas.strat_name_id);
    if (unit != null) {
      const { unit_id } = unit;
      data.push({
        ...meas,
        unit_id,
        ...(targetColumnParams ?? {})
      });
    }
  }
  return data;
}

/** An un-nested data point */
interface MeasureDataPoint {
  measure_value: number;
  measure_error: number;
  measure_position: number;
  measure_n: number;
  sample_no: string;
}

const keys = [
  "measure_value",
  "measure_error",
  "measure_position",
  "measure_n",
  "sample_no"
];

function buildDataPoint(
  meas: MeasurementLong,
  index: number
): MeasureDataPoint {
  let data = {} as MeasureDataPoint;
  for (const key of keys) {
    data[key] = meas[key][index];
  }
  return data;
}

export type FilterFunc = (
  dataPoint: MeasureDataPoint,
  index: number,
  measurement: MeasurementLong
) => boolean;

export function filterMeasurement(
  meas: MeasurementLong,
  filterFunc: FilterFunc
): MeasurementLong | null {
  let data = {} as MeasurementLong;
  for (const key of keys) {
    data[key] = [];
  }

  for (const [i, _] of meas.measure_value.entries()) {
    const dataPoint = buildDataPoint(meas, i);
    if (filterFunc(dataPoint, i, meas)) {
      for (const key of keys) {
        data[key].push(dataPoint[key]);
      }
    }
  }
  if (data.measure_value.length == 0) return null;
  return { ...meas, ...data };
}

export function filterMeasurements(
  measureData: MeasurementLong[],
  filterFunc: FilterFunc
): MeasurementLong[] {
  const data = [] as MeasurementLong[];
  for (const meas of measureData) {
    let newVal = filterMeasurement(meas, filterFunc);
    if (newVal != null) data.push(newVal);
  }
  return data;
}
