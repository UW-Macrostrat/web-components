import type { BaseUnit, UnitLong } from "@macrostrat/api-types";
import type { SectionInfo } from "../section";
import { group } from "d3-array";
import { ColumnAxisType } from "@macrostrat/column-components";
import {
  unitsOverlap,
  getUnitHeightRange,
  createUnitSorter,
  ensureArray,
  ensureRealFloat,
} from "./utils";

const dt = 0.001;

export interface ExtUnit extends BaseUnit {
  bottomOverlap: boolean;
  overlappingUnits: number[];
  column?: number;
  /* Positions (ages or heights) where the unit is clipped to its containing section.
   * This is relevant if we are filtering by age/height/depth range.
   */
  t_clip_pos?: number;
  b_clip_pos?: number;
}

export function preprocessUnits(
  section: SectionInfo,
  axisType: ColumnAxisType = ColumnAxisType.AGE
) {
  /** Preprocess units to add overlapping units and columns. */
  const units = section.units;
  let divisions = units.map((...args) => extendDivision(...args, axisType));
  for (let d of divisions) {
    const overlappingUnits = divisions.filter((u) =>
      d.overlappingUnits.includes(u.unit_id)
    );

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

    // If unit overlaps the edges of a section, set the clip positions
    if (axisType == ColumnAxisType.AGE) {
      const [b_pos, t_pos] = getUnitHeightRange(d, axisType);
      if (b_pos > section.b_age) {
        d.b_clip_pos = section.b_age;
      }
      if (t_pos < section.t_age) {
        d.t_clip_pos = section.t_age;
      }
    }
  }

  if (axisType != ColumnAxisType.AGE) {
    return preprocessSectionUnits(divisions, axisType);
  }

  return divisions;
}

function extendDivision(
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

export function groupUnitsIntoSections(
  units: BaseUnit[],
  axisType: ColumnAxisType = ColumnAxisType.AGE
): SectionInfo[] {
  let groups = Array.from(group(units, (d) => d.section_id));
  const unitComparator = createUnitSorter(axisType);

  const groups1 = groups.map(([section_id, sectionUnits]) => {
    const [b_age, t_age] = getSectionAgeRange(sectionUnits);
    // sort units by position
    sectionUnits.sort(unitComparator);
    return { section_id, t_age, b_age, units: sectionUnits };
  });
  // Sort sections by increasing top age, then increasing bottom age.
  // Sections have no relative ordinal position other than age...
  const compareSections = createUnitSorter(ColumnAxisType.AGE);
  groups1.sort(compareSections);
  return groups1;
}

export function getSectionAgeRange(units: BaseUnit[]): [number, number] {
  /** Get the overall age range of a set of units. */
  const t_ages = units.map((d) => d.t_age);
  const b_ages = units.map((d) => d.b_age);
  const t_age = Math.min(...t_ages);
  const b_age = Math.max(...b_ages);
  return [b_age, t_age];
}

export function mergeOverlappingSections<T extends SectionInfo>(
  sections: T[]
): T[] {
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

function mergeSections(a: SectionInfo, b: SectionInfo): SectionInfo {
  return {
    units: [...a.units, ...b.units],
    section_id: [...ensureArray(a.section_id), ...ensureArray(b.section_id)],
    t_age: Math.min(a.t_age, b.t_age),
    b_age: Math.max(a.b_age, b.b_age),
  };
}

export interface SectionUnit extends UnitLong {
  t_pos: number;
  b_pos: number;
}

function preprocessSectionUnits(
  units: ExtUnit[],
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
