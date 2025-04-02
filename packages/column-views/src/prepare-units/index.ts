import {
  getSectionAgeRange,
  groupUnitsIntoSections,
  mergeOverlappingSections,
  preprocessUnits,
} from "./helpers";
import { ColumnAxisType } from "@macrostrat/column-components";
import { useMemo } from "react";
import type { ExtUnit } from "./helpers";
import { BaseUnit } from "@macrostrat/api-types";
import {
  _collapseSmallUnconformities,
  collapseUnconformitiesByPixelHeight,
  ColumnScaleOptions,
  CompositeScaleInformation,
  computeSectionHeights,
  finalizeSectionHeights,
  SectionInfo,
  SectionInfoExt,
} from "./composite-scale";

export { preprocessUnits, groupUnitsIntoSections };

interface PrepareColumnOptions extends ColumnScaleOptions {
  axisType: ColumnAxisType;
  t_age?: number;
  b_age?: number;
  mergeSections?: MergeSectionsMode;
  collapseSmallUnconformities?: boolean | number;
}

export enum MergeSectionsMode {
  ALL = "all",
  OVERLAPPING = "overlapping",
}

export interface PreparedColumnData extends CompositeScaleInformation {
  sections: SectionInfoExt[];
  units: ExtUnit[];
}

export function usePreparedColumnUnits(
  data: BaseUnit[],
  options: PrepareColumnOptions
): PreparedColumnData {
  /** This function wraps and memoizes all preparation steps for converting
   * an array of units from the /units route to a form ready for usage.
   */
  return useMemo(() => {
    return prepareColumnUnits(data, options);
  }, [data, ...Object.values(options)]);
}

function prepareColumnUnits(
  units: BaseUnit[],
  options: PrepareColumnOptions
): PreparedColumnData {
  /** Prepare units for rendering into Macrostrat columns */

  const {
    t_age,
    b_age,
    mergeSections = MergeSectionsMode.OVERLAPPING,
    axisType,
    unconformityHeight,
    collapseSmallUnconformities = false,
  } = options;

  /** Prototype filtering to age range */
  let units1 = units.filter((d) => {
    // Filter by t_age and b_age
    return d.t_age >= (t_age ?? -Infinity) && d.b_age <= (b_age ?? Infinity);
  });

  let sections0: SectionInfo[];
  if (
    mergeSections == MergeSectionsMode.ALL &&
    axisType != ColumnAxisType.ORDINAL
  ) {
    const [b_unit_age, t_unit_age] = getSectionAgeRange(units1);
    sections0 = [
      {
        section_id: 0,
        /**
         * If ages limits are directly specified, use them to define the section bounds.
         * NOTE: we only do this for "mergeSections=ALL" and may separately configure
         * this behavior
         * */
        t_age: t_age ?? t_unit_age,
        b_age: b_age ?? b_unit_age,
        units: units1,
      },
    ];
  } else {
    sections0 = groupUnitsIntoSections(units1, axisType);
  }

  /** Merging overlapping sections really only makes sense for age/height/depth
   * columns. Ordinal columns are numbered by section so merging them
   * results in collisions.
   */
  let sections = sections0;
  if (
    mergeSections == MergeSectionsMode.OVERLAPPING &&
    axisType != ColumnAxisType.ORDINAL
  ) {
    sections = mergeOverlappingSections(sections);
  }

  /* Compute pixel scales etc. for sections
   * We need to do this now to determine which unconformities
   * are small enough to collapse.
   */
  sections = computeSectionHeights(sections, options);

  if (collapseSmallUnconformities ?? false) {
    let threshold = unconformityHeight ?? 30;
    if (typeof collapseSmallUnconformities == "number") {
      threshold = collapseSmallUnconformities;
    }

    sections = collapseUnconformitiesByPixelHeight(
      sections,
      threshold,
      options
    );
  }

  /** For each section, find units that are overlapping.
   * We do this after merging sections so that we can
   * handle cases where there are overlapping units across sections
   * */
  sections = sections.map((section) => {
    return {
      ...section,
      units: preprocessUnits(section.units, axisType),
    };
  });

  console.log("sections", sections);

  /** Reconstitute the units so that they are sorted by section.
   * This is mostly important so that unit keyboard navigation
   * predictably selects adjacent units.
   */
  const units2 = sections.reduce((acc, group) => {
    const { units } = group;
    for (const unit of units) {
      acc.push(unit);
    }
    return acc;
  }, []);

  /** Prepare section scale information using groups */
  const scaleInfo = finalizeSectionHeights(sections, unconformityHeight);

  return {
    units: units2,
    ...scaleInfo,
  };
}
