import {
  getSectionAgeRange,
  getSectionPosRange,
  groupUnitsIntoSectionsByOverlap,
  groupUnitsIntoSectionsBySectionID,
  mergeOverlappingSections,
  preprocessSectionUnit,
  preprocessUnits,
  UnitWithLayoutHints,
} from "./helpers";
import { ColumnAxisType } from "@macrostrat/column-components";
import { useMemo } from "react";
import { UnitLong } from "@macrostrat/api-types";
import {
  collapseUnconformitiesByPixelHeight,
  computeSectionHeights,
  finalizeSectionHeights,
  padWindowByPixels,
  resolveWindowScales,
  trimSectionsToWindow,
  type CompositeColumnScale,
} from "./composite-scale";
import {
  agesOverlap,
  MergeSectionsMode,
  PrepareColumnOptions,
  PreparedColumnData,
  unitsOverlap,
} from "./utils";
import { type ColumnHeightScaleOptions, SectionInfo } from "./types";

export * from "./utils";
export * from "./types";
export { preprocessUnits };
export type { CompositeColumnScale };

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

/** Apply `heightMultiplier` to the options that set how tall a section is
 * drawn. Multiplying all of them together scales the output heights exactly —
 * the density heuristic, the explicit scale, and both floors move as one, so
 * nothing changes but the size. Values the caller left unset stay unset (a
 * `null` `targetUnitHeight` means "a fixed pixel scale is in charge"), except
 * that a column relying on the default unit height still stretches. */
function stretchHeights(
  options: PrepareColumnOptions,
  multiplier: number,
): Partial<ColumnHeightScaleOptions> {
  if (multiplier === 1) return {};

  const stretched: Partial<ColumnHeightScaleOptions> = {};
  const keys = [
    "pixelScale",
    "targetUnitHeight",
    "minPixelScale",
    "minSectionHeight",
  ] as const;
  for (const key of keys) {
    const value = options[key];
    if (value != null) stretched[key] = value * multiplier;
  }

  // Nothing set the density, so the default unit height is what's in charge
  if (options.targetUnitHeight === undefined && options.pixelScale == null) {
    stretched.targetUnitHeight = DEFAULT_TARGET_UNIT_HEIGHT * multiplier;
  }
  return stretched;
}

/** Mirrors the default in `buildSectionScale` */
const DEFAULT_TARGET_UNIT_HEIGHT = 20;

export function prepareColumnUnits(
  units: UnitWithLayoutHints<UnitLong>[],
  options: PrepareColumnOptions,
): PreparedColumnData {
  /** Prepare units for rendering into Macrostrat columns */

  let { t_age, b_age, t_pos, b_pos } = options;

  const {
    mergeSections = MergeSectionsMode.OVERLAPPING,
    axisType,
    unconformityHeight,
    collapseSmallUnconformities = false,
    hybridScale,
    scale,
    windowPadding = 0,
    heightMultiplier = 1,
  } = options;

  let _totalHeight: number | null = null;

  if (scale != null) {
    // Set t_age and b_age based on scale domain if not already set
    const domain = scale.domain();
    if (axisType == ColumnAxisType.AGE) {
      if (t_age == null) t_age = Math.min(...domain);
      if (b_age == null) b_age = Math.max(...domain);
      _totalHeight = Math.abs(scale(b_age) - scale(t_age));
    } else {
      if (t_pos == null) t_pos = Math.min(...domain);
      if (b_pos == null) b_pos = Math.max(...domain);
      _totalHeight = Math.abs(scale(b_pos) - scale(t_pos));
    }
  }

  /** Age columns lay every section out at its full extent and clip to the
   * window at the end (see below), so that a section abutting the window is
   * sized by its own content rather than by the sliver that survives the clip.
   * Hybrid and externally-supplied scales build their own mapping and can't be
   * re-derived that way, so they keep the original clip-then-lay-out path. */
  const clipBeforeLayout =
    axisType != ColumnAxisType.AGE || hybridScale != null || scale != null;

  // Start by ensuring that ages and positions are numbers
  // also set up some values for eODP-style columns
  let units1 = units.map(preprocessSectionUnit);

  if (clipBeforeLayout) {
    /** Prototype filtering to age range */
    units1 = units1.filter((d) => {
      // Filter units by t_age and b_age, inclusive
      if (axisType == ColumnAxisType.AGE) {
        return agesOverlap(d, { t_age, b_age });
      } else {
        return unitsOverlap(d, { t_pos, b_pos } as any, axisType);
      }
    });
  }

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
  for (let section of clipBeforeLayout ? sections0 : []) {
    if (axisType == ColumnAxisType.AGE) {
      section.t_age = Math.max(section.t_age, t_age ?? -Infinity);
      section.b_age = Math.min(section.b_age, b_age ?? Infinity);
    } else if (axisType == ColumnAxisType.DEPTH) {
      section.t_pos = Math.max(section.t_pos, t_pos ?? -Infinity);
      section.b_pos = Math.min(section.b_pos, b_pos ?? Infinity);
    } else if (axisType == ColumnAxisType.HEIGHT) {
      section.t_pos = Math.max(section.t_pos, t_pos ?? -Infinity);
      section.b_pos = Math.min(section.b_pos, b_pos ?? Infinity);
    }
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

  /** The window we've been asked to render. Unit density is derived from what
   * it shows (see `findAverageUnitHeight`), so it has to be known before any
   * section is laid out — but nothing is *clipped* to it until the very end.
   */
  const focalWindow: [number, number] | null = clipBeforeLayout
    ? null
    : [b_age ?? Infinity, t_age ?? -Infinity];

  const layoutOptions = {
    ...options,
    ...stretchHeights(options, heightMultiplier),
    visibleWindow: focalWindow,
  };

  /* Compute pixel scales etc. for sections
   * We need to do this now to determine which unconformities
   * are small enough to collapse.
   */
  let sectionsWithScales = computeSectionHeights(sections, layoutOptions);

  if (collapseSmallUnconformities && hybridScale == null) {
    // Collapse small unconformities in pixel height space
    // TODO: this doesn't seem to work properly for non-age columns?
    let threshold = unconformityHeight ?? 30;
    if (typeof collapseSmallUnconformities == "number") {
      threshold = collapseSmallUnconformities;
    }

    sectionsWithScales = collapseUnconformitiesByPixelHeight(
      sectionsWithScales,
      threshold,
      layoutOptions,
    );
  }

  /** Now that every section is laid out at full extent — with its own density
   * and `minSectionHeight` already settled — apply the rendered window. Padding
   * is spent here, against real pixel heights, so `windowPadding` px of an
   * abutting section is exactly that many pixels.
   */
  if (focalWindow != null && (t_age != null || b_age != null)) {
    // Resolve final densities first (a section the window cuts short is
    // stretched to `minSectionHeight`), then spend the padding budget against
    // them, so a margin is the pixels asked for rather than those pixels times
    // whatever stretch its neighbor happened to need.
    const floor =
      layoutOptions.minSectionHeight ?? layoutOptions.targetUnitHeight ?? 0;
    const scales = resolveWindowScales(sectionsWithScales, focalWindow, floor);
    const scaleFor = (section) =>
      scales.get(section) ?? section.scaleInfo.pixelScale;

    const window =
      windowPadding > 0
        ? padWindowByPixels(
            sectionsWithScales,
            focalWindow,
            windowPadding,
            scaleFor,
          )
        : focalWindow;

    sectionsWithScales = trimSectionsToWindow(
      sectionsWithScales,
      window,
      scaleFor,
    );
  }

  /** Prepare section scale information using groups.
   * Total height is computed from section scales.
   * */
  let { totalHeight, sections: sections2 } = finalizeSectionHeights(
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
    totalHeight: _totalHeight ?? totalHeight,
    sections: sectionsOut,
  };
}
