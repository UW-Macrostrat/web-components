import {
  BaseUnit,
  MeasurementLong,
  ColumnSpec,
  StratUnit
} from "@macrostrat/api-types";

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
