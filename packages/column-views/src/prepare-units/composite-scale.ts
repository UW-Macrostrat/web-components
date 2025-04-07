import type { ExtUnit } from "./helpers";
import { ColumnAxisType } from "@macrostrat/column-components";
import { ensureArray } from "./utils";
import { ScaleLinear, scaleLinear } from "d3-scale";

export interface StratigraphicPackage {
  /** A collection of stratigraphic information organized in time, corresponding
   * to single or multiple columns. */
  t_age: number;
  b_age: number;
}

export interface SectionInfo extends StratigraphicPackage {
  /** A time-bounded part of a single stratigraphic column. */
  section_id: number | number[];
  units: ExtUnit[];
}

export interface ColumnHeightScaleOptions {
  /** A fixed pixel scale to use for the section (pixels per Myr) */
  pixelScale?: number;
  /** The target height of a constituent unit in pixels, for dynamic
   * scale generation */
  targetUnitHeight?: number;
  /** Min height of a section in pixels. Will override minPixelScale in some cases. */
  minSectionHeight?: number;
  /** The minimum pixel scale to use for the section (pixels per Myr). This is mostly
   * needed because small sections (<1-2 units) don't necessarily have space to comfortably
   * render two axis labels */
  minPixelScale?: number;
  // Axis scale type
  axisType?: ColumnAxisType;
  // Unconformity height in pixels
  unconformityHeight?: number;
  // Whether to collapse unconformities that are less than a height threshold
  collapseSmallUnconformities?: boolean | number;
}

export interface SectionScaleOptions extends ColumnHeightScaleOptions {
  axisType: ColumnAxisType;
  domain: [number, number];
}

export interface LinearScaleDef {
  domain: [number, number];
  pixelScale: number;
}

/** Output of a section scale. For now, this assumes that the
 * mapping is linear, but it could be extended to support arbitrary
 * scale functions.
 */
export interface PackageScaleInfo extends LinearScaleDef {
  pixelHeight: number;
  // TODO: add a function
  scale: ScaleLinear<number, number>;
}

export type PackageScaleLayoutData = PackageScaleInfo & {
  // A unique key for the section to use in React
  key: string;
  offset: number;
  // How much to
  paddingTop: number;
};

export type PackageLayoutData = SectionInfo & {
  scaleInfo: PackageScaleLayoutData;
  // A unique key for the section to use in React
  key: string;
};

export interface CompositeScaleData {
  totalHeight: number;
  sections: PackageScaleLayoutData[];
}

export interface ColumnScaleOptions extends ColumnHeightScaleOptions {
  axisType: ColumnAxisType;
  unconformityHeight: number;
}

// Composite scale information augmented with units in each package

export interface CompositeColumnData
  extends Omit<CompositeScaleData, "sections"> {
  sections: PackageLayoutData[];
}

export function buildCompositeScaleInfo(
  inputScales: LinearScaleDef[],
  unconformityHeight: number
): CompositeScaleData {
  /** Finalize the heights of sections, including the heights of unconformities
   * between them.
   */

  let totalHeight = unconformityHeight / 2;
  let lastSectionTopHeight = 0;

  const packages2: PackageScaleLayoutData[] = [];
  for (const group of inputScales) {
    const { domain, pixelScale } = group;
    const [b_age, t_age] = domain;
    const key = `package-${b_age}-${t_age}`;

    packages2.push({
      ...createPackageScale(group, totalHeight),
      key,
      offset: totalHeight,
      // Unconformity height above this particular section
      paddingTop: totalHeight - lastSectionTopHeight,
    });
    const pixelHeight = pixelScale * Math.abs(b_age - t_age);
    lastSectionTopHeight = totalHeight + pixelHeight;
    totalHeight = lastSectionTopHeight + unconformityHeight;
  }
  totalHeight += unconformityHeight / 2;
  return {
    totalHeight,
    sections: packages2,
  };
}

export function finalizeSectionHeights(
  sections: SectionInfoWithScale[],
  unconformityHeight: number
): CompositeColumnData {
  /** Finalize the heights of sections, including the heights of unconformities
   * between them.
   */

  const sectionScales = sections.map((d) => d.scaleInfo);
  const { totalHeight, sections: packages } = buildCompositeScaleInfo(
    sectionScales,
    unconformityHeight
  );

  // This could perhaps be simplified.
  const sections1: PackageLayoutData[] = [];
  for (const i in sections) {
    const group = sections[i];
    const scaleInfo = packages[i];
    sections1.push({
      ...group,
      key: scaleInfo.key,
      scaleInfo,
    });
  }
  return {
    totalHeight,
    sections: sections1,
  };
}

interface SectionInfoWithScale extends SectionInfo {
  scaleInfo: PackageScaleInfo;
}

export function computeSectionHeights(
  sections: SectionInfo[],
  opts: ColumnHeightScaleOptions
): SectionInfoWithScale[] {
  return sections.map((group) => {
    return addScaleToSection(group, opts);
  });
}

function addScaleToSection(
  group: SectionInfo,
  opts: ColumnScaleOptions
): SectionInfoWithScale {
  const { t_age, b_age, units } = group;
  let _range = null;
  // if t_age and b_age are set for a group, use them to define the range...
  if (t_age != null && b_age != null && opts.axisType == ColumnAxisType.AGE) {
    _range = [b_age, t_age];
  }

  const scaleInfo = buildSectionScale(units, {
    ...opts,
    domain: _range,
  });

  return {
    ...group,
    scaleInfo,
  };
}

function buildSectionScale(
  data: ExtUnit[],
  opts: SectionScaleOptions
): PackageScaleInfo {
  const {
    targetUnitHeight = 20,
    minPixelScale = 0.2,
    axisType,
    minSectionHeight,
  } = opts;
  const domain = opts.domain ?? findSectionHeightRange(data, axisType);

  const dAge = Math.abs(domain[0] - domain[1]);

  let _pixelScale = opts.pixelScale;
  if (_pixelScale == null) {
    // 0.2 pixel per myr is the floor scale
    const targetHeight = targetUnitHeight * data.length;
    // 1 pixel per myr is the floor scale
    _pixelScale = Math.max(targetHeight / dAge, minPixelScale);
  }

  let height = dAge * _pixelScale;

  // If height is less than minSectionHeight, set it to minSectionHeight
  const _minSectionHeight = minSectionHeight ?? targetUnitHeight ?? 0;
  height = Math.max(height, _minSectionHeight);
  _pixelScale = height / dAge;

  return createPackageScale({ domain, pixelScale: _pixelScale }, 0);
}

export function createPackageScale(
  def: LinearScaleDef,
  offset: number = 0
): PackageScaleInfo {
  /** Build a section scale */
  // Domain should be oriented from bottom to top, but scale is oriented from top to bottom
  const { domain, pixelScale } = def;
  const pixelHeight = pixelScale * Math.abs(domain[0] - domain[1]);
  return {
    domain,
    pixelScale,
    pixelHeight,
    scale: scaleLinear()
      .domain([domain[1], domain[0]])
      .range([offset, pixelHeight + offset]),
  };
}

function findSectionHeightRange(
  data: ExtUnit[],
  axisType: ColumnAxisType
): [number, number] {
  if (axisType == null) {
    throw new Error("Axis type is not set");
  }
  if (axisType === ColumnAxisType.AGE) {
    const t_age = Math.min(...data.map((d) => d.t_age));
    const b_age = Math.max(...data.map((d) => d.b_age));
    return [b_age, t_age];
  } else if (
    axisType == ColumnAxisType.DEPTH ||
    axisType == ColumnAxisType.ORDINAL
  ) {
    const t_pos = Math.min(...data.map((d) => d.t_pos));
    const b_pos = Math.max(...data.map((d) => d.b_pos));
    return [b_pos, t_pos];
  } else if (axisType == ColumnAxisType.HEIGHT) {
    const t_pos = Math.max(...data.map((d) => d.t_pos));
    const b_pos = Math.min(...data.map((d) => d.b_pos));
    return [b_pos, t_pos];
  }
}

export function createCompositeScale(
  sections: PackageLayoutData[],
  interpolateUnconformities: boolean = false
): (age: number) => number | null {
  /** Create a scale that works across multiple packages */
  // Get surfaces at which scale breaks
  let scaleBreaks: [number, number][] = [];
  for (const section of sections) {
    const { pixelHeight, pixelScale, offset, domain } = section.scaleInfo;

    scaleBreaks.push([domain[1], offset]);
    scaleBreaks.push([domain[0], offset + pixelHeight]);
  }
  // Sort the scale breaks by age
  scaleBreaks.sort((a, b) => a[0] - b[0]);

  return (age) => {
    /** Given an age, find the corresponding pixel position */
    // Iterate through the sections to find the correct one

    // Accumulate scale breaks and pixel height
    let pixelHeight = 0;
    let pixelScale = 0;
    let lastAge = null;
    for (const [age1, height] of scaleBreaks) {
      if (age <= age1) {
        if (lastAge != null) {
          pixelHeight += (age - lastAge) * pixelScale;
          return pixelHeight;
        }
        lastAge = age;
        pixelHeight = height;
      }
    }
  };
}

/** Collapse sections separated by unconformities that are smaller than a given pixel height. */
export function collapseUnconformitiesByPixelHeight(
  sections: SectionInfoWithScale[],
  threshold: number,
  opts: ColumnScaleOptions
): SectionInfoWithScale[] {
  const newSections = [];
  let currentSection: SectionInfoWithScale | null = null;
  for (const nextSection of sections) {
    if (currentSection == null) {
      currentSection = nextSection;
      continue;
    }
    const dAge = Math.abs(nextSection.t_age - currentSection.b_age);
    const pxHeight =
      dAge *
      Math.max(
        currentSection.scaleInfo.pixelScale,
        nextSection.scaleInfo.pixelScale
      );
    if (pxHeight < threshold) {
      // We need to merge the sections
      const compositeSection0: SectionInfo = {
        units: [...currentSection.units, ...nextSection.units],
        section_id: [
          ...ensureArray(currentSection.section_id),
          ...ensureArray(nextSection.section_id),
        ],
        t_age: Math.min(currentSection.t_age, nextSection.t_age),
        b_age: Math.max(currentSection.b_age, nextSection.b_age),
      };

      const compositeSection = addScaleToSection(compositeSection0, opts);
      currentSection = compositeSection;
    } else {
      // We need to keep the section
      newSections.push(currentSection);
      currentSection = nextSection;
    }
  }
  if (currentSection != null) {
    newSections.push(currentSection);
  }

  return newSections;
}
