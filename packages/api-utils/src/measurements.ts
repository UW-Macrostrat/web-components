import { BaseUnit, MeasurementLong } from "@macrostrat/api-types";

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
