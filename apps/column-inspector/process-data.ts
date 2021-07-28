import { BaseUnit } from "@macrostrat/api-types";

function unitsOverlap<T extends BaseUnit>(a: T, b: T) {
  return !(a.b_age <= b.t_age || a.t_age >= b.b_age);
}

function extendDivision(
  unit: UnitLong,
  i: number,
  divisions: UnitLong[]
): ExtUnit {
  const overlappingUnits = divisions.filter(
    d => d.unit_id != unit.unit_id && unitsOverlap(unit, d)
  );
  let bottomOverlap = false;
  for (const d of overlappingUnits) {
    if (d.b_age < unit.b_age) bottomOverlap = true;
  }
  return {
    ...unit,
    bottomOverlap,
    overlappingUnits: overlappingUnits.map(d => d.unit_id)
  };
}

function preprocessUnits(units) {
  return units.map(extendDivision);
}

export { extendDivision, preprocessUnits };
