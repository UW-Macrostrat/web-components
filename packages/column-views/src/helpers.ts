import { BaseUnit, UnitLong } from "@macrostrat/api-types";
import { IUnit } from "./units";
import { SectionInfo } from "./section";
import { group } from "d3-array";

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

export function extendDivision(
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

export function preprocessUnits(units: UnitLong[]) {
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

export function groupUnitsIntoSections(units: IUnit[]): SectionInfo[] {
  let groups = Array.from(group(units, (d) => d.section_id));
  return groups.map(([section_id, units]) => {
    const t_age = Math.min(...units.map((d) => d.t_age));
    const b_age = Math.max(...units.map((d) => d.b_age));
    return { section_id, t_age, b_age, units };
  });
}

export function _mergeOverlappingSections(
  sections: SectionInfo[]
): SectionInfo[] {
  /** Columns can have sections that overlap in time. Here, we merge overlapping
   * sections into a single section to correctly render gap-bound packages.
   */
  const [firstSection, ...rest] = sections;
  const newSections = [firstSection];
  for (const section of rest) {
    const lastSection = newSections[newSections.length - 1];
    if (
      lastSection.b_age < section.t_age ||
      lastSection.t_age > section.b_age
    ) {
      // No overlap, add the section as normal
      newSections.push(section);
      continue;
    }
    // Overlap, merge the sections
    lastSection.section_id = [
      ...ensureArray(lastSection.section_id),
      ...ensureArray(section.section_id),
    ];
    lastSection.units.push(...section.units);
    lastSection.b_age = Math.max(lastSection.b_age, section.b_age);
    lastSection.t_age = Math.min(lastSection.t_age, section.t_age);
  }
  return newSections;
}

export function ensureArray<T>(x: T | T[]): T[] {
  if (Array.isArray(x)) {
    return x;
  }
  return [x];
}
