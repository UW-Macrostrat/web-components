import type { BaseUnit, UnitIdentifier, UnitLong } from "@macrostrat/api-types";
import { group } from "d3-array";
import { ColumnAxisType } from "@macrostrat/column-components";
import {
  createUnitSorter,
  ensureArray,
  ensureRealFloat,
  getUnitHeightRange,
  unitsOverlap,
} from "./utils";
import {
  AgeRangeRelationship,
  compareAgeRanges,
} from "@macrostrat/stratigraphy-utils";
import type { ExtUnit, SectionInfo, StratigraphicPackage } from "./types";

const dt = 0.001;

export type UnitWithDefinedOverlap<T extends BaseUnit> = T & {
  overlap: UnitOverlapInfo<T>;
};

type UnitOverlapInfo<T extends BaseUnit> = {
  column: number;
  nColumns: number;
  unitGroup: UnitGroup<T>;
};

class UnitGroup<T extends BaseUnit> implements StratigraphicPackage {
  units: T[];

  constructor(units: T[]) {
    this.units = units;
  }

  get t_age(): number {
    return Math.min(...this.units.map((d) => d.t_age));
  }

  get b_age(): number {
    return Math.max(...this.units.map((d) => d.b_age));
  }

  includes(unit: UnitIdentifier | number): boolean {
    const unit_id = typeof unit === "number" ? unit : unit.unit_id;
    return this.units.some((d) => d.unit_id === unit_id);
  }

  getUnits(): UnitWithDefinedOverlap<T>[] {
    return assignColumnsToUnitsWithinOverlappingGroup(this);
  }
}

function groupUnitsByMutualOverlap<T extends BaseUnit>(
  units: T[],
  tolerance: number = dt,
): UnitGroup<T>[] {
  let sourceUnits = units;
  let groups: UnitGroup<T>[] = [];
  while (sourceUnits.length > 0) {
    const unit = sourceUnits[0];
    const overlappingUnits = sourceUnits.filter((d) =>
      unitsOverlap(unit, d, ColumnAxisType.AGE, tolerance),
    );
    groups.push(new UnitGroup(overlappingUnits));
    sourceUnits = sourceUnits.filter(
      (d) => !overlappingUnits.some((ou) => ou.unit_id === d.unit_id),
    );
  }
  return groups;
}

const sortByAge = createUnitSorter(ColumnAxisType.AGE);

function assignColumnsToUnitsWithinOverlappingGroup<T extends BaseUnit>(
  group: UnitGroup<T>,
): UnitWithDefinedOverlap<T>[] {
  /** A relatively naïve function to assign columns to units within a mutually overlapping group.
   * This gets the number of columns that would be needed to accommodate the units in the group.
   * It then assigns columns to units in the group based on the number of columns needed, with
   * lower units further to the left.
   */

  const sortedUnits = [...group.units].sort((a, b) => b.b_age - a.b_age);

  const columns: T[][] = [];

  for (const unit of sortedUnits) {
    // Find a column that is not already occupied by an overlapping unit
    let didAddToExistingColumn = false;
    for (const column of columns) {
      const lastUnit = column[column.length - 1];
      if (!unitsOverlap(unit, lastUnit, ColumnAxisType.AGE, dt)) {
        column.push(unit);
        didAddToExistingColumn = true;
        break;
      }
    }
    if (!didAddToExistingColumn) {
      columns.push([unit]);
    }
  }

  const units: UnitWithDefinedOverlap<T>[] = columns.flatMap(
    (column, columnIndex) =>
      column.map((unit) => {
        return {
          ...unit,
          overlap: {
            column: columnIndex,
            nColumns: columns.length,
            unitGroup: group,
          },
        };
      }),
  );

  return units.toSorted(sortByAge);
}

export function preprocessUnits<T extends UnitLong = UnitLong>(
  section: SectionInfo<T>,
  axisType: ColumnAxisType = ColumnAxisType.AGE,
): ExtUnit[] {
  /** Preprocess units to add overlapping units and columns. */
  let units = section.units;

  let tolerance = 0.001; // 1 kyr tolerance for age columns
  if (axisType != ColumnAxisType.AGE) {
    tolerance = 0.01; // 1cm tolerance for height/depth columns
  }

  const unitGroups = groupUnitsByMutualOverlap(units, tolerance);

  const divisions: any[] = [];
  // Serialize all groups' units to a single array
  for (const group of unitGroups) {
    divisions.push(...group.getUnits());
  }
  //
  // for (const unit of units) {
  //   const overlappingUnits = units.filter(
  //     (d) =>
  //       d.unit_id != unit.unit_id && unitsOverlap(unit, d, axisType, tolerance),
  //   );
  //   let column = 0;
  //   if (overlappingUnits.length == 1) {
  //     column = 1;
  //   }
  //
  //   let d = {
  //     ...unit,
  //     column: unit.column ?? column,
  //     overlappingUnits: overlappingUnits.map((d) => d.unit_id),
  //   };
  //   divisions.push(d);
  // }

  for (let d of divisions) {
    // const overlappingUnits = divisions.filter((u) =>
    //   d.overlappingUnits.includes(u.unit_id),
    // );
    //
    // // Overlapping columns
    // const columns = overlappingUnits.map((d) => d.column);
    //
    // if (columns.includes(d.column)) {
    //   let col = 0;
    //   // Go through columns to find a better index
    //   while (columns.includes(col)) {
    //     col++;
    //   }
    //   d.column ??= col;
    // }

    // If unit overlaps the edges of a section, set the clip positions
    const [b_pos, t_pos] = getUnitHeightRange(d, axisType);
    if (axisType == ColumnAxisType.AGE) {
      if (b_pos > section.b_age) {
        d.b_clip_pos = section.b_age;
      }
      if (t_pos < section.t_age) {
        d.t_clip_pos = section.t_age;
      }
    }
    if (axisType == ColumnAxisType.DEPTH) {
      if (b_pos > section.b_pos) {
        d.b_clip_pos = section.b_pos;
      }
      if (t_pos < section.t_pos) {
        d.t_clip_pos = section.t_pos;
      }
    }
    // if (axisType == ColumnAxisType.HEIGHT) {
    //   if (b_pos < section.b_pos) {
    //     d.b_clip_pos = section.b_pos;
    //   }
    //   if (t_pos > section.t_pos) {
    //     d.t_clip_pos = section.t_pos;
    //   }
    // }
  }

  return divisions;
}

export function groupUnitsIntoSectionsBySectionID<T extends UnitLong>(
  units: T[],
  axisType: ColumnAxisType = ColumnAxisType.AGE,
): SectionInfo<T>[] {
  /** Group units into sections by section_id.
   * This works for large-scale Macrostrat columns, where units are grouped by section_id.
   * */
  let groups = Array.from(group(units, (d) => d.section_id));
  const unitComparator = createUnitSorter(axisType);

  const groups1 = groups.map(([section_id, sectionUnits]) => {
    const [b_age, t_age] = getSectionAgeRange(sectionUnits);
    const [b_pos, t_pos] = getSectionPosRange(sectionUnits, axisType);

    // sort units by position
    sectionUnits.sort(unitComparator);
    return { section_id, t_age, b_age, b_pos, t_pos, units: sectionUnits };
  });
  // Sort sections by increasing top age, then increasing bottom age.
  // Sections have no relative ordinal position other than age...
  const compareSections = createUnitSorter(axisType) as (
    a: StratigraphicPackage,
    b: StratigraphicPackage,
  ) => number;
  groups1.sort(compareSections);
  return groups1;
}

interface WorkingSection {
  units: UnitLong[];
  // Position or age
  heightRange?: [number, number];
}

export function groupUnitsIntoSectionsByOverlap<T extends UnitLong>(
  units: T[],
  axisType: ColumnAxisType = ColumnAxisType.AGE,
): SectionInfo<T>[] {
  /** Group units into sections by overlap.
   * This creates "synthetic" sections that correspond to packages bound by scale gaps.
   * This is most useful in the height and depth domains, where gaps (e.g., missing core) are
   * common.
   * */
  // Start with each unit as its own "section", and progressively merge...
  const sectionList: WorkingSection[] = [];
  for (const unit of units) {
    // Check if the unit overlaps with any existing section
    const heightRange = getUnitHeightRange(unit, axisType);
    let section: WorkingSection | undefined = sectionList.find(
      (s) =>
        compareAgeRanges(heightRange, s.heightRange) !==
        AgeRangeRelationship.Disjoint,
    );
    if (section == null) {
      // No overlap, create a new section
      sectionList.push({
        heightRange,
        units: [unit],
      });
    } else {
      // Overlap, merge the unit into the section
      section.units.push(unit);
      // Update the height range
      if (axisType == ColumnAxisType.DEPTH || axisType == ColumnAxisType.AGE) {
        section.heightRange = [
          Math.max(section.heightRange[0], heightRange[0]),
          Math.min(section.heightRange[1], heightRange[1]),
        ];
      } else {
        section.heightRange = [
          Math.min(section.heightRange[0], heightRange[0]),
          Math.max(section.heightRange[1], heightRange[1]),
        ];
      }
    }
  }
  // We should have a section for each unit, now we can convert to SectionInfo
  // Ages have to be really actually ages, not heights

  return sectionList.map((section, i) => {
    const [b_age, t_age] = getSectionAgeRange(section.units);
    const [b_pos, t_pos] = getSectionPosRange(section.units, axisType);
    return {
      // Negative section IDs are used to indicate that these are synthetic sections
      section_id: -i,
      t_age,
      b_age,
      t_pos,
      b_pos,
      units: section.units as T[],
    };
  });
}

export function getSectionPosRange(
  units: BaseUnit[],
  axisType: ColumnAxisType,
): [number, number] {
  /** Get the overall position range of a set of units. */
  const t_positions = units.map((d) => {
    switch (axisType) {
      case ColumnAxisType.AGE:
        return d.t_age;
      case ColumnAxisType.DEPTH:
      case ColumnAxisType.HEIGHT:
      case ColumnAxisType.ORDINAL:
        return d.t_pos;
      default:
        throw new Error(`Unknown axis type: ${axisType}`);
    }
  });
  const b_positions = units.map((d) => {
    switch (axisType) {
      case ColumnAxisType.AGE:
        return d.b_age;
      case ColumnAxisType.DEPTH:
      case ColumnAxisType.HEIGHT:
      case ColumnAxisType.ORDINAL:
        return d.b_pos;
      default:
        throw new Error(`Unknown axis type: ${axisType}`);
    }
  });
  if (axisType == ColumnAxisType.AGE || axisType == ColumnAxisType.DEPTH) {
    return [Math.max(...b_positions), Math.min(...t_positions)];
  } else {
    return [Math.min(...b_positions), Math.max(...t_positions)];
  }
}

export function getSectionAgeRange(units: BaseUnit[]): [number, number] {
  /** Get the overall age range of a set of units. */
  return getSectionPosRange(units, ColumnAxisType.AGE);
}

export function mergeOverlappingSections<T extends UnitLong>(
  sections: SectionInfo<T>[],
): SectionInfo<T>[] {
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

export function preprocessSectionUnit(unit: UnitLong): UnitLong {
  /** Preprocess a single unit for a "section" column type.
   * This mostly handles vagaries of eODP-style columns.
   * */

  let b_pos = unit.b_pos;
  let t_pos = unit.t_pos;

  let unit_name = unit.unit_name;

  // eODP columns sometimes have overlapping core sections, which are encoded in the name field
  // Match eODP section names
  const match = unit.unit_name.match(/^(\d+(\.\d+)?)-(\d+(\.\d+)?): (.+)/);

  if (match) {
    // These values should already be set if we've used the show_positions flag
    t_pos ??= ensureRealFloat(match[1]);
    b_pos ??= ensureRealFloat(match[3]);
    unit_name = match[5];
  }

  return {
    ...unit,
    b_pos: ensureRealFloat(b_pos),
    t_pos: ensureRealFloat(t_pos),
    unit_name,
  };
}
