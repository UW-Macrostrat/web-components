import {
  _mergeOverlappingSections,
  groupUnitsIntoSections,
  preprocessUnits,
} from "./helpers";
import { ColumnAxisType } from "@macrostrat/column-components";
import { useMemo } from "react";
import type { SectionInfo } from "../section";
import type { ExtUnit } from "./helpers";
import { BaseUnit } from "@macrostrat/api-types";

export { preprocessUnits, groupUnitsIntoSections };

interface PrepareColumnOptions {
  axisType: ColumnAxisType;
  t_age?: number;
  b_age?: number;
  mergeOverlappingSections?: boolean;
}

export function usePreparedColumnUnits(
  data: BaseUnit[],
  options: PrepareColumnOptions
): [SectionInfo[], ExtUnit[]] {
  /** This function wraps and memoizes all preparation steps for converting
   * an array of units from the /units route to a form ready for usage.
   */
  const [sectionGroups, units] = useMemo(() => {
    return prepareColumnUnits(data, options);
  }, [data, ...Object.values(options)]);

  return [sectionGroups, units];
}

function prepareColumnUnits(
  units: BaseUnit[],
  options: PrepareColumnOptions
): [SectionInfo[], ExtUnit[]] {
  const {
    t_age = -Infinity,
    b_age = Infinity,
    mergeOverlappingSections,
    axisType,
  } = options;

  /** Prototype filtering to age range */
  let units1 = units.filter((d) => {
    // Filter by t_age and b_age
    return d.t_age >= t_age && d.b_age <= b_age;
  });

  /** Add some elements that help with sorting, cross-axis positioning, etc. */
  const data1 = preprocessUnits(units1, axisType);

  let sections = groupUnitsIntoSections(data1, axisType);
  /** Merging overlapping sections really only makes sense for age/height/depth
   * columns. Ordinal columns are numbered by section so merging them
   * results in collisions.
   */
  if (mergeOverlappingSections && axisType != ColumnAxisType.ORDINAL) {
    sections = _mergeOverlappingSections(sections);
  }

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

  return [sections, units2];
}
