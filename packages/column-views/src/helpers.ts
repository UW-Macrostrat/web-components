import { BaseUnit, UnitLong } from "@macrostrat/api-types";
import { IUnit } from "./units";
import { SectionInfo } from "./section";
import { group } from "d3-array";
import {
  AgeRangeRelationship,
  compareAgeRanges,
} from "@macrostrat/stratigraphy-utils";
import { ColumnAxisType } from "@macrostrat/column-components";

const dt = 0.001;

function unitsOverlap<T extends BaseUnit>(
  a: T,
  b: T,
  axisType: ColumnAxisType = ColumnAxisType.AGE,
  tolerance: number = 0.001
): boolean {
  const rel = compareAgeRanges(
    getUnitHeightRange(a, axisType),
    getUnitHeightRange(b, axisType),
    tolerance
  );
  return rel != AgeRangeRelationship.Disjoint;
}

export function getUnitHeightRange(
  unit: BaseUnit,
  axisType: ColumnAxisType
): [number, number] {
  switch (axisType) {
    case ColumnAxisType.AGE:
      return [unit.b_age, unit.t_age];
    case ColumnAxisType.DEPTH:
    case ColumnAxisType.ORDINAL:
    case ColumnAxisType.HEIGHT:
      return [unit.b_pos, unit.t_pos];
    default:
      throw new Error(`Unknown axis type: ${axisType}`);
  }
}

interface ExtUnit extends UnitLong {
  bottomOverlap: boolean;
  overlappingUnits: number[];
  column?: number;
}

export function extendDivision(
  unit: UnitLong,
  i: number,
  divisions: UnitLong[],
  axisType: ColumnAxisType = ColumnAxisType.AGE
): ExtUnit {
  const overlappingUnits = divisions.filter(
    (d) => d.unit_id != unit.unit_id && unitsOverlap(unit, d, axisType)
  );
  const u_pos = getUnitHeightRange(unit, axisType);
  const bottomOverlap = overlappingUnits.some((d) => {
    const d_pos = getUnitHeightRange(d, axisType);
    // Check if the unit is below the current unit
    return d_pos[0] < u_pos[0] + dt;
  });
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

export function preprocessUnits(
  units: UnitLong[],
  axisType: ColumnAxisType = ColumnAxisType.AGE
) {
  if (axisType != ColumnAxisType.AGE) {
    return preprocessSectionUnits(units, axisType);
  }

  /** Preprocess units to add overlapping units and columns. */
  let divisions = units.map((...args) => extendDivision(...args, axisType));
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

export interface SectionUnit extends UnitLong {
  t_pos: number;
  b_pos: number;
}

function preprocessSectionUnits(
  units: UnitLong[],
  axisType: ColumnAxisType = ColumnAxisType.DEPTH
): SectionUnit[] {
  /** Preprocess units for a "section" column type, which is guaranteed to be simpler. */
  // We have to assume the units are ordered...
  let thickness = 0;
  const units1 = units.map((unit, i) => {
    let u1 = preprocessSectionUnit(unit, i, units, thickness, axisType);
    thickness += Math.abs(u1.t_pos - u1.b_pos);
    return u1;
  });

  // Sort the units by t_pos
  //units1.sort((a, b) => a.t_pos - b.t_pos);
  //console.log(units1);
  return units1;
}

function preprocessSectionUnit(
  unit: UnitLong,
  i: number,
  units: UnitLong[],
  accumulatedThickness: number = 0,
  axisType: ColumnAxisType = ColumnAxisType.DEPTH
): SectionUnit {
  /** Preprocess a single unit for a "section" column type.
   * No provision for overlapping units.
   * */

  let b_pos = unit.b_pos;
  let t_pos = unit.t_pos;

  if (b_pos == t_pos && axisType == ColumnAxisType.ORDINAL) {
    t_pos = t_pos - 1;
  }

  let unit_name = unit.unit_name;

  // eODP columns sometimes have overlapping core sections, which are encoded in the name field
  // Match eODP section names
  const match = unit.unit_name.match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?): (.+)/);

  if (match) {
    // These values should already be set if we've used the show_positions flag
    t_pos ??= match[1];
    b_pos ??= match[3];
    unit_name = match[5];
  }

  return {
    ...unit,
    b_pos: ensureRealFloat(b_pos),
    t_pos: ensureRealFloat(t_pos),
    unit_name,
  };
}

function ensureRealFloat(x: number | string | null): number | null {
  if (typeof x == "string") {
    x = parseFloat(x);
  }
  if (isNaN(x)) {
    return null;
  }
  return x;
}
