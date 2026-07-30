import { ColumnAxisType } from "@macrostrat/column-components";
import { ensureArray, getUnitHeightRange } from "./utils";
import { ScaleContinuousNumeric, scaleLinear } from "d3-scale";
import { zoomIdentity, ZoomTransform } from "d3-zoom";
import { UnitLong } from "@macrostrat/api-types";
import { buildHybridScale } from "./dynamic-scales";
import { ExtUnit, HybridScaleType, SectionInfo } from "./types";
import type {
  ColumnScaleOptions,
  CompositeColumnData,
  CompositeScaleData,
  PackageLayoutData,
  PackageScaleInfo,
  PackageScaleLayoutData,
  SectionScaleOptions,
} from "./types";

// Composite scale information augmented with units in each package

export function buildCompositeScaleInfo(
  inputScales: PackageScaleInfo[],
  unconformityHeight: number,
): CompositeScaleData {
  /** Finalize the heights of sections, including the heights of unconformities
   * between them.
   */

  let totalHeight = unconformityHeight / 2;
  let lastSectionTopHeight = 0;

  const packages2: PackageScaleLayoutData[] = [];
  for (const group of inputScales) {
    const { domain, scale } = group;
    const [b_age, t_age] = domain;
    const key = `package-${b_age}-${t_age}`;

    packages2.push({
      ...createPackageScale(group, totalHeight),
      key,
      offset: totalHeight,
      // Unconformity height above this particular section
      paddingTop: totalHeight - lastSectionTopHeight,
    });

    const pixelHeight = Math.abs(scale(b_age) - scale(t_age));
    lastSectionTopHeight = totalHeight + pixelHeight;
    totalHeight = lastSectionTopHeight + unconformityHeight;
  }
  totalHeight += unconformityHeight / 2;
  return {
    totalHeight,
    sections: packages2,
  };
}

export function finalizeSectionHeights<T extends UnitLong>(
  sections: SectionInfoWithScale<T>[],
  unconformityHeight: number,
): CompositeColumnData<T> {
  /** Finalize the heights of sections, including the heights of unconformities
   * between them.
   */

  const sectionScales = sections.map((d) => d.scaleInfo);

  const { totalHeight, sections: packages } = buildCompositeScaleInfo(
    sectionScales,
    unconformityHeight,
  );

  // This could perhaps be simplified.
  const sections1: PackageLayoutData<T>[] = [];
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

export interface SectionInfoWithScale<
  T extends UnitLong = ExtUnit,
> extends SectionInfo<T> {
  scaleInfo: PackageScaleInfo;
}

export function computeSectionHeights<T extends UnitLong>(
  sections: SectionInfo<T>[],
  opts: ColumnScaleOptions,
): SectionInfoWithScale<T>[] {
  return sections.map((group) => {
    return addScaleToSection<T>(group, opts);
  });
}

function addScaleToSection<T extends UnitLong = ExtUnit>(
  group: SectionInfo<T>,
  opts: ColumnScaleOptions,
): SectionInfoWithScale<T> {
  const { t_age, b_age, t_pos, b_pos, units } = group;
  let _range = null;
  // if t_age and b_age are set for a group, use them to define the range...
  if (opts.axisType == ColumnAxisType.AGE) {
    _range = [b_age, t_age];
  } else {
    _range = [b_pos, t_pos];
  }

  const scaleInfo = buildSectionScale<T>(units, {
    ...opts,
    domain: _range,
  });

  return {
    ...group,
    scaleInfo,
  };
}

function buildSectionScale<T extends UnitLong>(
  data: T[],
  opts: SectionScaleOptions,
): PackageScaleInfo {
  const {
    targetUnitHeight = 20,
    minPixelScale = 0.2,
    axisType,
    minSectionHeight,
    scale,
    hybridScale,
  } = opts;
  const domain = opts.domain ?? findSectionHeightRange(data, axisType);

  const dAge = Math.abs(domain[0] - domain[1]);

  let _pixelScale = opts.pixelScale;
  let pixelHeight: number;

  if (hybridScale != null) {
    /** In an equidistant surfaces scale, we want to determine the heights of surfaces
     * and then distribute units evenly between them.
     * This is somewhat like an ordinal scale
     */
    if (hybridScale.type === HybridScaleType.EquidistantSurfaces) {
      _pixelScale ??= targetUnitHeight;
    }

    return buildHybridScale(hybridScale, data, domain, {
      pixelOffset: 0,
      pixelScale: _pixelScale,
    });
  }

  if (scale == null) {
    if (_pixelScale == null) {
      const avgAgeRange = findAverageUnitHeight(data, axisType);
      // Get pixel height necessary to render average unit at target height
      _pixelScale = Math.max(targetUnitHeight / avgAgeRange, minPixelScale);

      // OLD METHOD that cares about overall section height vs. individual unit height
      // 0.2 pixel per myr is the floor scale
      //const targetHeight = targetUnitHeight * data.length;
      // 1 pixel per myr is the floor scale
      //_pixelScale = Math.max(targetHeight / dAge, minPixelScale);
    }

    let height = dAge * _pixelScale;
    // If height is less than minSectionHeight, set it to minSectionHeight
    const _minSectionHeight = minSectionHeight ?? targetUnitHeight ?? 0;
    pixelHeight = Math.max(height, _minSectionHeight);
    _pixelScale = pixelHeight / dAge;
  } else {
    // If a scale is provided, use it to compute pixel height
    pixelHeight = Math.abs(scale(domain[0]) - scale(domain[1]));
  }

  return createPackageScale(
    { scale, domain, pixelHeight, pixelScale: _pixelScale },
    0,
  );
}

export function createPackageScale(
  def: PackageScaleInfo,
  offset: number = 0,
): PackageScaleInfo {
  /** Build a section scale */
  // Domain should be oriented from bottom to top, but scale is oriented from top to bottom
  const { domain, pixelScale, pixelHeight, scale, heightScale } = def;

  if (scale == null && pixelScale == null) {
    throw new Error("Either scale or pixelScale must be provided");
  }

  let _scale: ScaleContinuousNumeric<number, number>;
  if (scale == null) {
    _scale = scaleLinear()
      .domain([domain[1], domain[0]])
      .range([offset, pixelHeight + offset]);
  } else {
    const domain0 = scale.domain();
    const range0 = scale.range();
    _scale = scale
      .copy()
      .domain(domain0)
      .range(range0.map((d) => d + offset));
  }

  _scale.clamp();

  let _heightScale = null;
  if (heightScale != null) {
    // Adjust height scale as well
    const range0 = scale.range();
    _heightScale = heightScale.copy().range(range0.map((d) => d + offset));
    _heightScale.clamp();
  }

  return {
    domain,
    pixelScale,
    pixelHeight,
    scale: _scale,
    // Internal details for hybrid scales. TODO: improve this
    heightScale: _heightScale,
  };
}

function findSectionHeightRange(
  data: UnitLong[],
  axisType: ColumnAxisType,
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

function findAverageUnitHeight(
  data: UnitLong[],
  axisType: ColumnAxisType,
): number {
  const unitHeights = data.map((d) => {
    const [b_pos, t_pos] = getUnitHeightRange(d, axisType);
    return Math.abs(b_pos - t_pos);
  });
  return unitHeights.reduce((a, b) => a + b, 0) / unitHeights.length;
}

export interface CompositeColumnScale {
  (age: number): number | null;
  copy(): CompositeColumnScale;
  domain(): [number, number];
  invert(pixelHeight: number): number | null;
  clamp(clamp: boolean): void;
}

export function createCompositeScale(
  sections: PackageLayoutData[],
  interpolateUnconformities: boolean = false,
): CompositeColumnScale {
  /** Create a scale that works across multiple packages */

  const scales: ScaleContinuousNumeric<number, number>[] = [];

  let lastScale: ScaleContinuousNumeric<number, number> | null = null;
  for (const section of sections) {
    const _scale = section.scaleInfo.scale.copy().clamp(true);
    scales.push(_scale);
    if (lastScale != null && interpolateUnconformities) {
      // Add a new scale that interpolates between lastScale and _scale
      const lastDomain = lastScale.domain();
      const lastRange = lastScale.range();
      const currentDomain = _scale.domain();
      const currentRange = _scale.range();

      const interpScale = scaleLinear()
        .domain([lastDomain[lastDomain.length - 1], currentDomain[0]])
        .range([lastRange[lastRange.length - 1], currentRange[0]])
        .clamp(true);
      scales.push(interpScale);
    }
    lastScale = _scale;
  }

  const scale: CompositeColumnScale = (age) => {
    for (const s of scales) {
      const domain = s.domain();
      if (
        domain[0] < domain[domain.length - 1] &&
        age >= domain[0] &&
        age <= domain[domain.length - 1]
      ) {
        // Age axes
        return s(age);
      } else if (age <= domain[0] && age >= domain[domain.length - 1]) {
        // Normal axes like height
        return s(age);
      }
    }
    return null;
  };

  scale.copy = () => {
    return createCompositeScale(sections, interpolateUnconformities);
  };

  scale.domain = () => {
    /** Return the domain of the scale */
    const vals = sections.flatMap((d) => d.scaleInfo.domain);
    if (vals[0] < vals[vals.length - 1]) {
      // age axes
      return [Math.min(...vals), Math.max(...vals)];
    }
    // Normal axes like height
    return [Math.max(...vals), Math.min(...vals)];
  };

  scale.invert = (pixelHeight) => {
    /** Invert the scale to get the age at a given pixel height */
    // Iterate through the sections to find the correct one
    for (const scale of scales) {
      const range = scale.range();
      if (
        pixelHeight > Math.min(...range) &&
        pixelHeight <= Math.max(...range)
      ) {
        //console.log("Inverting scale at pixel height", pixelHeight);
        return scale.invert(pixelHeight);
      }
    }
    return null;
  };

  scale.clamp = (clamp: boolean) => {
    /** Clamp all constituent scales */
    for (const s of scales) {
      s.clamp(clamp);
    }
  };

  return scale;
}

/**
 * A composite column scale that can be re-derived under a shared `d3` vertical
 * zoom transform, so changing the visible span animates instead of snapping.
 *
 * The transform operates in **composite pixel space** (`applyY` on every pixel
 * coordinate: section offsets, ranges, `totalHeight`). Section *domains* are
 * untouched — only their pixel output moves/scales — so units, axis ticks, and
 * the correlation timescale all reflow because they read the section scale's
 * range. At `zoomIdentity` this is byte-for-byte today's layout.
 *
 * The pan model (whether `ty` comes from the transform or from a DOM scroll
 * container) is a *driver* concern; this primitive just applies whatever
 * transform it is handed, so it supports both.
 */
export interface TransformableCompositeScale extends CompositeColumnScale {
  /** The transform currently applied (identity for the baked layout). */
  transform: ZoomTransform;
  /** Section layout data under the current transform (rescaled ranges/offsets). */
  sections: PackageLayoutData[];
  /** Total pixel height under the current transform. */
  totalHeight: number;
  /** Re-derive the whole scale under a new transform. */
  rescale(transform: ZoomTransform): TransformableCompositeScale;
  /**
   * Compute the transform that fits an age span to a pixel viewport, using the
   * *base* (untransformed) pixel positions so repeated zooms compose correctly.
   * Returns null for a degenerate span.
   */
  transformForAgeRange(
    ageRange: [number, number],
    viewportHeight: number,
  ): ZoomTransform | null;
}

export function createTransformableCompositeScale(
  baseSections: PackageLayoutData[],
  baseTotalHeight: number,
  transform: ZoomTransform = zoomIdentity,
  interpolateUnconformities: boolean = true,
): TransformableCompositeScale {
  const k = transform.k;

  // Apply the transform to every pixel coordinate of each section. Domains are
  // preserved; only the pixel range moves/scales.
  const sections: PackageLayoutData[] = baseSections.map((section) => ({
    ...section,
    scaleInfo: transformPackageScale(section.scaleInfo, transform),
  }));

  // Stitch the transformed section scales into one piecewise composite scale,
  // reusing the existing (age→pixel / invert / domain) machinery.
  const composite = createCompositeScale(sections, interpolateUnconformities);

  const scale = composite as TransformableCompositeScale;
  scale.transform = transform;
  scale.sections = sections;
  scale.totalHeight = baseTotalHeight * k;

  scale.rescale = (nextTransform: ZoomTransform) =>
    createTransformableCompositeScale(
      baseSections,
      baseTotalHeight,
      nextTransform,
      interpolateUnconformities,
    );

  scale.transformForAgeRange = (ageRange, viewportHeight) => {
    // Base (identity) composite for stable pixel positions across repeated zooms.
    const base = createCompositeScale(baseSections, interpolateUnconformities);
    const p0 = base(ageRange[0]);
    const p1 = base(ageRange[1]);
    if (p0 == null || p1 == null || p0 === p1) return null;
    const top = Math.min(p0, p1);
    const bottom = Math.max(p0, p1);
    const nextK = viewportHeight / (bottom - top);
    if (!isFinite(nextK) || nextK <= 0) return null;
    return zoomIdentity.translate(0, -top * nextK).scale(nextK);
  };

  // Preserve the base copy() semantics but keep the transformable surface.
  scale.copy = () =>
    createTransformableCompositeScale(
      baseSections,
      baseTotalHeight,
      transform,
      interpolateUnconformities,
    );

  return scale;
}

/**
 * Apply a vertical zoom transform to a single package's scale info, in pixel
 * space. The domain is preserved; the pixel range, offset, and derived pixel
 * metrics scale by `k` and shift by `ty`.
 */
export function transformPackageScale(
  info: PackageScaleLayoutData,
  transform: ZoomTransform,
): PackageScaleLayoutData {
  const { k, y: ty } = transform;
  if (k === 1 && ty === 0) return info;

  const applyY = (p: number) => p * k + ty;
  const newScale = info.scale.copy().range(info.scale.range().map(applyY));

  let newHeightScale = info.heightScale;
  if (newHeightScale != null) {
    newHeightScale = newHeightScale
      .copy()
      .range(newHeightScale.range().map(applyY));
  }

  return {
    ...info,
    scale: newScale,
    heightScale: newHeightScale,
    offset: info.offset * k + ty,
    pixelHeight: info.pixelHeight * k,
    pixelScale: info.pixelScale == null ? info.pixelScale : info.pixelScale * k,
    paddingTop: info.paddingTop * k,
  };
}

/**
 * Apply a vertical zoom transform to a composite scale-info bundle
 * (`{ totalHeight, packages }`), leaving the rest of the object untouched.
 * At `zoomIdentity` it returns the input unchanged (same references), so
 * threading a transform through a consumer is a no-op until it zooms.
 */
export function transformCompositeScaleInfo<
  T extends { totalHeight: number; packages: PackageScaleLayoutData[] },
>(scaleInfo: T, transform: ZoomTransform): T {
  if (transform.k === 1 && transform.y === 0) return scaleInfo;
  return {
    ...scaleInfo,
    totalHeight: scaleInfo.totalHeight * transform.k,
    packages: scaleInfo.packages.map((p) => transformPackageScale(p, transform)),
  };
}

/** Collapse sections separated by unconformities that are smaller than a given pixel height. */
export function collapseUnconformitiesByPixelHeight<T extends UnitLong>(
  sections: SectionInfoWithScale<T>[],
  threshold: number,
  opts: ColumnScaleOptions,
): SectionInfoWithScale<T>[] {
  const newSections = [];
  let currentSection: SectionInfoWithScale<T> | null = null;
  for (const nextSection of sections) {
    if (currentSection == null) {
      currentSection = nextSection;
      continue;
    }
    let heights: [number, number];
    let pxHeights: [number, number];
    if (opts.axisType !== ColumnAxisType.AGE) {
      heights = [nextSection.t_pos, currentSection.b_pos];
    } else {
      heights = [nextSection.t_age, currentSection.b_age];
    }

    const _diff = (vals: number[]) => {
      return Math.abs(vals[0] - vals[1]);
    };

    pxHeights = [
      _diff(heights.map(nextSection.scaleInfo.scale)),
      _diff(heights.map(currentSection.scaleInfo.scale)),
    ];

    const pxHeight = Math.min(...pxHeights);

    if (pxHeight < threshold) {
      let t_pos: number;
      let b_pos: number;
      if (
        opts.axisType == ColumnAxisType.AGE ||
        opts.axisType == ColumnAxisType.DEPTH
      ) {
        t_pos = Math.min(currentSection.t_pos, nextSection.t_pos);
        b_pos = Math.max(currentSection.b_pos, nextSection.b_pos);
      } else {
        t_pos = Math.max(currentSection.t_pos, nextSection.t_pos);
        b_pos = Math.min(currentSection.b_pos, nextSection.b_pos);
      }

      // We need to merge the sections
      const compositeSection0: SectionInfo<T> = {
        units: [...currentSection.units, ...nextSection.units],
        section_id: [
          ...ensureArray(currentSection.section_id),
          ...ensureArray(nextSection.section_id),
        ],
        t_age: Math.min(currentSection.t_age, nextSection.t_age),
        b_age: Math.max(currentSection.b_age, nextSection.b_age),
        t_pos,
        b_pos,
      };

      currentSection = addScaleToSection(compositeSection0, opts);
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
