import {
  BaseUnit,
  UnitLong,
} from "/Users/Daven/Projects/Macrostrat/Software/web/deps/web-components/packages/api-types/src";

// Time resolution is 100 years
const dt = 0.0001;

function unitsOverlap<T extends BaseUnit>(a: T, b: T) {
  return !(a.b_age <= b.t_age + dt || a.t_age >= b.b_age - dt);
}

interface ExtUnit extends UnitLong {
  bottomOverlap: boolean;
  overlappingUnits: number[];
  column?: number;
}

function extendDivision(
  unit: UnitLong,
  i: number,
  divisions: UnitLong[]
): ExtUnit {
  const overlappingUnits = divisions.filter(
    (d) => d.unit_id != unit.unit_id && unitsOverlap(unit, d)
  );
  let bottomOverlap = false;
  for (const d of overlappingUnits) {
    if (d.b_age < unit.b_age) bottomOverlap = true;
  }

  let column = 0;
  if (overlappingUnits.length == 1) {
    column = 1;
  }

  return {
    ...unit,
    bottomOverlap,
    column,
    overlappingUnits: overlappingUnits.map((d) => d.unit_id),
  };
}

function preprocessUnits(units: UnitLong[]) {
  let divisions = units.map(extendDivision);
  for (let d of divisions) {
    const overlappingUnits = divisions.filter((u) =>
      d.overlappingUnits.includes(u.unit_id)
    );

    const maxNOverlapping = Math.max(
      Math.max(
        ...d.overlappingUnits.map(
          (uid) =>
            divisions.find((u) => u.unit_id == uid).overlappingUnits.length
        ),
        0
      )
    );

    //d.maxNOverlapping = maxNOverlapping;

    // Overlapping columns
    const columns = overlappingUnits.map((d) => d.column);

    if (columns.includes(d.column)) {
      let col = 0;
      // Go through columns to find a better index
      while (columns.includes(col)) {
        col++;
      }
      d.column = col;
    }
  }

  return divisions;
}

export { extendDivision, preprocessUnits };
