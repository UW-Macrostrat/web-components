import { ColumnAxisType } from "@macrostrat/column-components";
import { agesOverlap, ensureArray, getUnitHeightRange } from "./utils";
import { ScaleContinuousNumeric, scaleLinear } from "d3-scale";
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
  for (let i = 0; i < inputScales.length; i++) {
    const group = inputScales[i];
    const { domain, scale } = group;
    const [b_age, t_age] = domain;
    // Positionally stable key: packages are always emitted in age order, so the
    // index is a stable identity. An age-based key (`package-${b_age}-${t_age}`)
    // changes every frame while the age window animates, forcing every package,
    // column, and timescale slice in the correlation chart to remount each frame.
    const key = `package-${i}`;

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
    // If height is less than minSectionHeight, set it to minSectionHeight.
    // Sections reach here at their *full* extent (the rendered window is applied
    // afterwards, by `trimSectionsToWindow`), so this floor only ever inflates a
    // genuinely small section — which is what it's for — and never a sliver that
    // the window happens to cut.
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

/**
 * The density each section will actually render at once the window is applied.
 *
 * A section the window cuts short is still being *looked at*, so
 * `minSectionHeight` applies to what remains — it's honored by expanding the
 * section's scale, not by showing more of it. Resolving this **before** padding
 * matters: padding is a pixel margin measured at the density it will render at,
 * and a section stretched to the floor afterwards would multiply the margin
 * along with everything else (a 20 px margin in a band stretched 4× renders at
 * 80 px, and asymmetrically so whenever one side is truncated).
 *
 * Sections the window leaves whole keep their laid-out density — they already
 * met the floor when they were sized.
 */
export function resolveWindowScales<T extends UnitLong>(
  sections: SectionInfoWithScale<T>[],
  focalWindow: [number, number],
  floor: number,
): Map<SectionInfoWithScale<T>, number> {
  const [b_focal, t_focal] = focalWindow;
  const scales = new Map<SectionInfoWithScale<T>, number>();

  for (const section of sections) {
    const t_age = Math.max(section.t_age, t_focal);
    const b_age = Math.min(section.b_age, b_focal);
    // Sections outside the focal window are visible only as padding; they keep
    // their own density and render exactly the pixels asked for.
    if (b_age <= t_age) continue;

    const natural = section.scaleInfo.pixelScale;
    if (!(natural > 0)) continue;

    const isClipped = b_age < section.b_age || t_age > section.t_age;
    const needed = isClipped && floor > 0 ? floor / (b_age - t_age) : 0;
    scales.set(section, Math.max(natural, needed));
  }
  return scales;
}

/**
 * Expand an age window outward by `padding` **pixels** of column, spending the
 * budget against sections that are already laid out at full extent, at the
 * densities they will finally render at (`scaleFor`).
 *
 * Because the layout is done, this is exact rather than predicted: each section
 * contributes its own real pixel height. Padding collapses when the column runs
 * out on that side.
 *
 * Unconformities between sections cost nothing. They render at a fixed height
 * that's typically larger than the padding itself (30–60 px), so charging them
 * would mean padding could never reach across a gap — which is the case it
 * exists for: revealing the neighboring section keeps its timescale intervals
 * navigable. The padding is a budget of neighboring *content*.
 */
export function padWindowByPixels<T extends UnitLong>(
  sections: SectionInfoWithScale<T>[],
  window: [number, number],
  padding: number,
  scaleFor: (section: SectionInfoWithScale<T>) => number,
): [number, number] {
  if (!(padding > 0) || sections.length === 0) return window;
  const [b_age, t_age] = window;
  return [
    spendOutward(sections, b_age, 1, padding, scaleFor),
    spendOutward(sections, t_age, -1, padding, scaleFor),
  ];
}

/** Walk out from one edge of the window through laid-out sections, spending a
 * pixel budget, and return the age it lands on. `direction` is +1 toward older
 * ages, -1 toward younger. */
function spendOutward<T extends UnitLong>(
  sections: SectionInfoWithScale<T>[],
  edge: number,
  direction: 1 | -1,
  padding: number,
  scaleFor: (section: SectionInfoWithScale<T>) => number,
): number {
  // Sections ordered outward from the edge, keeping only what lies beyond it.
  const beyond = sections
    .filter(
      (s) => direction * (s.b_age - edge) > 0 || direction * (s.t_age - edge) > 0,
    )
    .sort((a, b) => direction * (nearEdge(a, direction) - nearEdge(b, direction)));

  let bound = edge;
  let budget = padding;

  for (const section of beyond) {
    const pixelScale = scaleFor(section);
    if (!(pixelScale > 0)) continue;

    const from =
      direction > 0
        ? Math.max(section.t_age, bound)
        : Math.min(section.b_age, bound);
    const available = direction > 0 ? section.b_age - from : from - section.t_age;
    if (available <= 0) continue;

    const cost = available * pixelScale;
    if (budget <= cost) return from + direction * (budget / pixelScale);

    bound = direction > 0 ? section.b_age : section.t_age;
    budget -= cost;
  }
  return bound;
}

/** The age at which a section starts, measured from the window edge outward. */
function nearEdge<T extends UnitLong>(
  section: SectionInfoWithScale<T>,
  direction: 1 | -1,
): number {
  return direction > 0 ? section.t_age : section.b_age;
}

/**
 * Clip laid-out sections to the rendered window — the last step of layout, so
 * that every section has already been sized (and floored) at its full extent.
 * Each section renders at the density `scaleFor` resolved for it, which is what
 * keeps a padding margin the same number of pixels as the band it borders is
 * stretched to meet `minSectionHeight`.
 */
export function trimSectionsToWindow<T extends UnitLong>(
  sections: SectionInfoWithScale<T>[],
  window: [number, number],
  scaleFor: (section: SectionInfoWithScale<T>) => number,
): SectionInfoWithScale<T>[] {
  const [b_win, t_win] = window;
  const out: SectionInfoWithScale<T>[] = [];

  for (const section of sections) {
    const t_age = Math.max(section.t_age, t_win);
    const b_age = Math.min(section.b_age, b_win);
    if (b_age <= t_age) continue;

    const pixelScale = scaleFor(section);
    if (
      b_age === section.b_age &&
      t_age === section.t_age &&
      pixelScale === section.scaleInfo.pixelScale
    ) {
      out.push(section);
      continue;
    }

    out.push({
      ...section,
      t_age,
      b_age,
      units: section.units.filter((u) => agesOverlap(u, { t_age, b_age })),
      scaleInfo: createPackageScale({
        domain: [b_age, t_age],
        pixelScale,
        pixelHeight: (b_age - t_age) * pixelScale,
        scale: null,
      }),
    });
  }
  return out;
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
