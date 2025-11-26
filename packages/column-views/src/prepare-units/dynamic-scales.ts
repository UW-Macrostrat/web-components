import {
  ExtUnit,
  getSectionAgeRange,
  getSectionPosRange,
  groupUnitsIntoSectionsByOverlap,
  groupUnitsIntoSectionsBySectionID,
  mergeOverlappingSections,
  preprocessSectionUnit,
  preprocessUnits,
} from "./helpers";
import { ColumnAxisType } from "@macrostrat/column-components";
import { UnitLong } from "@macrostrat/api-types";
import {
  collapseUnconformitiesByPixelHeight,
  computeSectionHeights,
  finalizeSectionHeights,
  PackageScaleInfo,
} from "./composite-scale";
import type { SectionInfo } from "./helpers";
import {
  agesOverlap,
  MergeSectionsMode,
  PrepareColumnOptions,
  PreparedColumnData,
  unitsOverlap,
} from "./utils";
import { scaleLinear } from "d3-scale";

export enum HybridScaleType {
  // An age-domain scale that puts equal vertical space between surfaces
  EquidistantSurfaces = "equidistant-surfaces",
  // A height-domain scale that is based on the average height of units between surfaces
  ApproximateHeight = "approximate-height",
}

export function prepareColumnUnitsEquidistant(
  units: UnitLong[],
  options: PrepareColumnOptions,
): PreparedColumnData {
  /** Prepare units for rendering into Macrostrat columns */

  let { t_age, b_age, t_pos, b_pos } = options;

  const {
    mergeSections = MergeSectionsMode.OVERLAPPING,
    unconformityHeight,
    collapseSmallUnconformities = false,
    scale,
  } = options;

  const axisType = ColumnAxisType.AGE;

  if (scale != null) {
    // Set t_age and b_age based on scale domain if not already set
    const domain = scale.domain();
    if (axisType == ColumnAxisType.AGE) {
      if (t_age == null) t_age = Math.min(...domain);
      if (b_age == null) b_age = Math.max(...domain);
    } else {
      if (t_pos == null) t_pos = Math.min(...domain);
      if (b_pos == null) b_pos = Math.max(...domain);
    }
  }

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

  let mergeMode = mergeSections;
  // if (axisType != ColumnAxisType.AGE) {
  //   // For non-age columns, we always merge sections.
  //   // This is because the "groupUnitsIntoSections" function is not well-defined
  //   // for non-age columns.
  //   mergeMode = MergeSectionsMode.ALL;
  // }

  let sections0: SectionInfo<UnitLong>[];
  if (mergeMode == MergeSectionsMode.ALL) {
    // For the "merge sections" mode, we need to create a single section
    const [b_unit_pos, t_unit_pos] = getSectionPosRange(units1, axisType);
    const [b_unit_age, t_unit_age] = getSectionAgeRange(units1);
    sections0 = [
      {
        section_id: 0,
        /**
         * If ages limits are directly specified, use them to define the section bounds.
         * */
        t_pos: t_unit_pos,
        b_pos: b_unit_pos,
        t_age: t_unit_age,
        b_age: b_unit_age,
        units: units1,
      },
    ];
  } else if (axisType == ColumnAxisType.AGE) {
    sections0 = groupUnitsIntoSectionsBySectionID(units1, axisType);
  } else {
    sections0 = groupUnitsIntoSectionsByOverlap(units1, axisType);
  }

  // Limit sections to the range specified by t_age/b_age or t_pos/b_pos global options
  for (let section of sections0) {
    section.t_age = Math.max(section.t_age, t_age ?? -Infinity);
    section.b_age = Math.min(section.b_age, b_age ?? Infinity);
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

  // SCALES

  /* Compute pixel scales etc. for sections
   * We need to do this now to determine which unconformities
   * are small enough to collapse.
   */
  let sectionsWithScales = computeSectionHeights(sections, options);

  /** Prepare section scale information using groups */
  let { totalHeight, sections: sections2 } = finalizeSectionHeights(
    sectionsWithScales,
    unconformityHeight,
    axisType,
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

interface BaseSurface {
  index: number;
  age: number;
  units_below: number[];
  units_above: number[];
}

export function buildColumnSurfaces<T extends UnitLong>(
  units: T[],
  tolerance: number = 0.001,
): BaseSurface[] {
  /** Compute age surfaces for a column based on unit tops and bottoms */
  const surfaces: Omit<BaseSurface, "index">[] = [];
  for (const unit of units) {
    // Top surface
    surfaces.push({
      age: unit.t_age,
      units_below: [unit.unit_id],
      units_above: [],
    });
    // Bottom surface
    surfaces.push({
      age: unit.b_age,
      units_above: [unit.unit_id],
      units_below: [],
    });
  }

  // Merge duplicate surfaces (same age)
  const mergedSurfaces: Omit<BaseSurface, "index">[] = [];
  for (const surface of surfaces) {
    const existingSurface = mergedSurfaces.find(
      (s) => Math.abs(s.age - surface.age) < tolerance,
    );
    if (existingSurface) {
      existingSurface.units_above.push(...surface.units_above);
      existingSurface.units_below.push(...surface.units_below);
    } else {
      mergedSurfaces.push(surface);
    }
  }

  // Sort surfaces by age (ascending)
  mergedSurfaces.sort((a, b) => a.age - b.age);

  return mergedSurfaces.map((s, i) => ({ ...s, index: i }));
}

interface AgeDomainUnitInfo {
  t_age: number;
  b_age: number;
  units: ExtUnit[];
}

function getUnitsInAgeDomains(
  surfaces: BaseSurface[],
  units: ExtUnit[],
): AgeDomainUnitInfo[] {
  // Get unit IDs represented between the same surface, and the proportion of their total height represented
  const domainUnitInfo: AgeDomainUnitInfo[] = [];
  for (let i = 0; i < surfaces.length - 1; i++) {
    const topSurface = surfaces[i];
    const bottomSurface = surfaces[i + 1];
    const unitsInDomain = units.filter((unit) => {
      return (
        unit.t_age <= topSurface.age + 0.001 &&
        unit.b_age >= bottomSurface.age - 0.001
      );
    });
    domainUnitInfo.push({
      t_age: topSurface.age,
      b_age: bottomSurface.age,
      units: unitsInDomain,
    });
  }
  return domainUnitInfo;
}

function proportionOfUnitInDomain(
  unit: ExtUnit,
  t_age: number,
  b_age: number,
): number {
  // Compute the proportion of a unit's height that lies within the given age domain
  const unitHeight = unit.t_age - unit.b_age;
  if (unitHeight <= 0) return 0;
  const overlapTop = Math.min(unit.t_age, t_age);
  const overlapBottom = Math.max(unit.b_age, b_age);
  const overlapHeight = Math.max(0, overlapTop - overlapBottom);
  return overlapHeight / unitHeight;
}

interface VariableAgeScaleOptions {
  tolerance: number;
  domainHeight: number;
}

export function buildScaleFromSurfaces(
  surfaces: BaseSurface[],
  pixelOffset: number, // height in pixels at which to start the scale
  pixelScale: number, // pixels per unit
): PackageScaleInfo {
  /** Build a variable age scale that places age surfaces equally far apart in height space.
   * It is presumed that gaps are already removed from the unit set provided.
   * */

  const domain: [number, number] = [
    surfaces[surfaces.length - 1].age,
    surfaces[0].age,
  ];
  // Compute the height in pixels for each surface

  const surfaceHeights = surfaces.map((surface, i) => {
    return i * 20;
  });

  // Build a piecewise linear scale mapping age to pixel height
  const ageDomain = surfaces.map((s) => s.age);
  const pixelRange = surfaceHeights;

  const scale = scaleLinear().domain(ageDomain).range(pixelRange);

  return {
    scale,
    pixelScale: null, // pixels per unit
    domain,
    pixelHeight: Math.abs(pixelRange[pixelRange.length - 1] - pixelRange[0]),
  };
}
