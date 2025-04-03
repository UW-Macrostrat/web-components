import type { ExtUnit } from "./helpers";
import { ColumnAxisType } from "@macrostrat/column-components";
import { ensureArray } from "./utils";
import { ScaleLinear, scaleLinear } from "d3-scale";

export interface SectionInfo {
  section_id: number | number[];
  t_age: number;
  b_age: number;
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

/** Output of a section scale. For now, this assumes that the
 * mapping is linear, but it could be extended to support arbitrary
 * scale functions.
 */
export interface SectionScaleInfo {
  domain: [number, number];
  pixelScale: number;
  pixelHeight: number;
  // TODO: add a function
  scale: ScaleLinear<number, number>;
}

export type SectionInfoExt = SectionInfo & {
  scaleInfo: SectionScaleInfo & {
    offset: number;
    paddingTop: number;
  };
  // A unique key for the section to use in React
  key: string;
};

export interface CompositeScaleInformation {
  totalHeight: number;
  sections: SectionInfoExt[];
}

export interface ColumnScaleOptions extends ColumnHeightScaleOptions {
  axisType: ColumnAxisType;
  unconformityHeight: number;
}

export function finalizeSectionHeights(
  sections: SectionInfoWithScale[],
  unconformityHeight: number
): CompositeScaleInformation {
  /** Finalize the heights of sections, including the heights of unconformities
   * between them.
   */

  let totalHeight = unconformityHeight / 2;
  let lastSectionTopHeight = 0;

  const sections1: SectionInfoExt[] = [];
  for (const group of sections) {
    const { scaleInfo } = group;

    const scale1 = scaleInfo.scale
      .copy()
      .range(scaleInfo.scale.range().map((d) => d + totalHeight));

    sections1.push({
      ...group,
      key: `section-${group.section_id}`,
      scaleInfo: {
        ...scaleInfo,
        offset: totalHeight,
        // Unconformity height above this particular section
        paddingTop: totalHeight - lastSectionTopHeight,
        scale: scale1,
      },
    });
    lastSectionTopHeight = totalHeight + scaleInfo.pixelHeight;
    totalHeight = lastSectionTopHeight + unconformityHeight;
  }
  totalHeight += unconformityHeight / 2;
  return {
    totalHeight,
    sections: sections1,
  };
}

interface SectionInfoWithScale extends SectionInfo {
  scaleInfo: SectionScaleInfo;
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

  console.log(group.section_id, scaleInfo);

  return {
    ...group,
    scaleInfo,
  };
}

function buildSectionScale(
  data: ExtUnit[],
  opts: SectionScaleOptions
): SectionScaleInfo {
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
  const _minSectionHeight = minSectionHeight ?? targetUnitHeight;
  if (height < _minSectionHeight) {
    height = _minSectionHeight;
    _pixelScale = _minSectionHeight / dAge;
  }

  return {
    domain,
    pixelScale: _pixelScale,
    pixelHeight: height,
    scale: scaleLinear().domain([domain[1], domain[0]]).range([0, height]),
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
  sections: SectionInfoExt[],
  interpolateUnconformities: boolean = false
): (age: number) => number | null {
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
