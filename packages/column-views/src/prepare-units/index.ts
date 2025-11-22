import {
  getSectionAgeRange,
  getSectionPosRange,
  groupUnitsIntoSections,
  mergeOverlappingSections,
  preprocessSectionUnit,
  preprocessUnits,
} from "./helpers";
import { ColumnAxisType } from "@macrostrat/column-components";
import { useMemo } from "react";
import type { ExtUnit } from "./helpers";
import { UnitLong } from "@macrostrat/api-types";
import {
  collapseUnconformitiesByPixelHeight,
  ColumnScaleOptions,
  CompositeColumnData,
  computeSectionHeights,
  finalizeSectionHeights,
  PackageLayoutData,
} from "./composite-scale";
import type { SectionInfo } from "./helpers";
import { agesOverlap, getUnitHeightRange, unitsOverlap } from "./utils";

export * from "./utils";
export { preprocessUnits, groupUnitsIntoSections };

export interface PrepareColumnOptions extends ColumnScaleOptions {
  axisType: ColumnAxisType;
  t_age?: number;
  b_age?: number;
  t_pos?: number;
  b_pos?: number;
  mergeSections?: MergeSectionsMode;
  collapseSmallUnconformities?: boolean | number;
}

export enum MergeSectionsMode {
  ALL = "all",
  OVERLAPPING = "overlapping",
}

export interface PreparedColumnData extends CompositeColumnData {
  sections: PackageLayoutData[];
  units: ExtUnit[];
}

export function usePreparedColumnUnits(
  data: UnitLong[],
  options: PrepareColumnOptions,
): PreparedColumnData {
  /** This function wraps and memoizes all preparation steps for converting
   * an array of units from the /units route to a form ready for usage.
   */
  return useMemo(() => {
    return prepareColumnUnits(data, options);
  }, [data, ...Object.values(options)]);
}

export function prepareColumnUnits(
  units: UnitLong[],
  options: PrepareColumnOptions,
): PreparedColumnData {
  /** Prepare units for rendering into Macrostrat columns */

  const {
    t_age,
    b_age,
    t_pos,
    b_pos,
    mergeSections = MergeSectionsMode.OVERLAPPING,
    axisType,
    unconformityHeight,
    collapseSmallUnconformities = false,
  } = options;

  // Start by ensuring that ages and positions are numbers
  // also set up some values for eODP-style columns
  let units1 = units.map(preprocessSectionUnit);

  /** Prototype filtering to age range */
  units1 = units1.filter((d) => {
    // Filter units by t_age and b_age, inclusive
    if (axisType == ColumnAxisType.AGE) {
      return agesOverlap(d, { t_age, b_age });
    } else {
      return unitsOverlap(d, { t_pos, b_pos } as any, axisType);
    }
  });

  let sections0: SectionInfo<UnitLong>[];
  if (axisType == ColumnAxisType.AGE) {
    if (
      mergeSections == MergeSectionsMode.ALL &&
      axisType == ColumnAxisType.AGE
    ) {
      // For the "merge sections" mode, we need to create a single section
      const [b_unit_age, t_unit_age] = getSectionAgeRange(units1);
      sections0 = [
        {
          section_id: 0,
          /**
           * If ages limits are directly specified, use them to define the section bounds.
           * */
          t_age: t_age ?? t_unit_age,
          b_age: b_age ?? b_unit_age,
          units: units1,
        },
      ];
    } else {
      sections0 = groupUnitsIntoSections(units1, axisType);
    }
  } else {
    const [b_unit_pos, t_unit_pos] = getSectionPosRange(units1, axisType);
    const [t_age, b_age] = getSectionAgeRange(units1);
    sections0 = [
      {
        section_id: 0,
        t_pos: t_pos ?? t_unit_pos,
        b_pos: b_pos ?? b_unit_pos,
        t_age,
        b_age,
        units: units1,
      },
    ];
  }

  /** Merging overlapping sections really only makes sense for age/height/depth
   * columns. Ordinal columns are numbered by section so merging them
   * results in collisions.
   */
  let sections = sections0;
  if (
    mergeSections == MergeSectionsMode.OVERLAPPING &&
    axisType == ColumnAxisType.AGE
  ) {
    sections = mergeOverlappingSections(sections);
  }
  // Filter out undefined sections just in case
  sections = sections.filter((d) => d != null);

  /* Now that we are done merging sections, we can ensure that our sections
   * are correctly limited to the t_age and b_age applied to the overall column.
   */
  sections = sections.map((section) => {
    let { t_pos, b_pos } = section;
    if (axisType == ColumnAxisType.DEPTH) {
      t_pos = Math.max(section.t_pos, options.t_pos ?? -Infinity);
      b_pos = Math.min(section.b_pos, options.b_pos ?? Infinity);
    } else if (axisType == ColumnAxisType.HEIGHT) {
      t_pos = Math.max(section.t_pos, options.t_pos ?? -Infinity);
      b_pos = Math.min(section.b_pos, options.b_pos ?? Infinity);
    }

    return {
      ...section,
      t_age: Math.max(section.t_age, options.t_age ?? -Infinity),
      b_age: Math.min(section.b_age, options.b_age ?? Infinity),
      t_pos,
      b_pos,
    };
  });

  /* Compute pixel scales etc. for sections
   * We need to do this now to determine which unconformities
   * are small enough to collapse.
   */
  let sectionsWithScales = computeSectionHeights(sections, options);

  if (collapseSmallUnconformities ?? false) {
    let threshold = unconformityHeight ?? 30;
    if (typeof collapseSmallUnconformities == "number") {
      threshold = collapseSmallUnconformities;
    }

    sectionsWithScales = collapseUnconformitiesByPixelHeight(
      sectionsWithScales,
      threshold,
      options,
    );
  }

  /** Prepare section scale information using groups */
  const { totalHeight, sections: sections2 } = finalizeSectionHeights(
    sectionsWithScales,
    unconformityHeight,
  );

  /** For each section, find units that are overlapping.
   * We do this after merging sections so that we can
   * handle cases where there are overlapping units across sections
   * */
  const sectionsOut = sections2.map((section) => {
    return {
      ...section,
      units: preprocessUnits(section, axisType),
    };
  });

  /** Reconstitute the units so that they are sorted by section and properly enhanced.
   * This is mostly important so that unit keyboard navigation
   * predictably selects adjacent units.
   */
  const units2 = sectionsOut.reduce((acc, group) => {
    const { units } = group;
    for (const unit of units) {
      acc.push(unit);
    }
    return acc;
  }, []);

  return {
    units: units2,
    totalHeight,
    sections: sectionsOut,
  };
}
