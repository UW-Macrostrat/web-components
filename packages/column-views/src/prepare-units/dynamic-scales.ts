import type { UnitLong } from "@macrostrat/api-types";
import { scaleLinear } from "d3-scale";
import { getUnitHeightRange } from "./utils";
import { ColumnAxisType } from "@macrostrat/column-components";
import { mergeAgeRanges, MergeMode } from "@macrostrat/stratigraphy-utils";
import type {
  ApproxHeightScaleOptions,
  ExtUnit,
  HybridScaleDefinition,
  HybridScaleOptions,
  PackageScaleInfo,
} from "./types";
import { HybridScaleType, HeightMethod } from "./types";

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

  const rng = getUnitHeightRange(unit, ColumnAxisType.AGE);
  const rng1: [number, number] = [b_age, t_age];
  // Compute overlap

  const mergedRange = mergeAgeRanges([rng, rng1], MergeMode.Inner);

  const unitHeight = Math.abs(rng[1] - rng[0]);
  const mergedHeight = Math.abs(mergedRange[1] - mergedRange[0]);

  return mergedHeight / unitHeight;
}

export function buildHybridScale<T extends UnitLong>(
  def: HybridScaleDefinition,
  units: T[],
  domain: [number, number],
  options: HybridScaleOptions = {},
): PackageScaleInfo {
  const surfaces = buildColumnSurfaces(units);

  const filteredSurfaces = surfaces.filter(
    (s) => s.age < Math.max(...domain) && s.age > Math.min(...domain),
  );

  const s1 = [
    { index: -1, age: Math.min(...domain), units_above: [], units_below: [] },
    ...filteredSurfaces,
    {
      index: -1,
      age: Math.max(...domain),
      units_above: [],
      units_below: [],
    },
  ];

  const { type, ...rest } = def;

  if (type === HybridScaleType.EquidistantSurfaces) {
    return buildScaleFromSurfacesSimple(s1, options);
  }

  return buildApproximateHeightScale(s1, units, { ...options, ...rest });
}

function getApproximateHeight(
  unit: ExtUnit,
  method: HeightMethod = HeightMethod.Maximum,
): number | null {
  // Get approximate height of a unit based on specified method
  const heights = [];
  let minHeight = unit.min_thick;
  if (method === HeightMethod.Minimum || method === HeightMethod.Average) {
    const h = unit.min_thick;
    if (h != null && !isNaN(h) && h > 0) heights.push(h);
  }
  if (method === HeightMethod.Average || method === HeightMethod.Maximum) {
    const h = unit.max_thick;
    if (h != null && !isNaN(h) && h > 0) heights.push(h);
  }

  if (heights.length === 0) return null;

  if (method === HeightMethod.Average) {
    return heights.reduce((sum, h) => sum + h, 0) / heights.length;
  } else {
    return heights[0];
  }
}

export function buildApproximateHeightScale(
  surfaces: BaseSurface[],
  units: UnitLong[],
  options: HybridScaleOptions & ApproxHeightScaleOptions = {},
): PackageScaleInfo {
  /** Build a variable age scale that places age surfaces equally far apart in height space.
   * It is presumed that gaps are already removed from the unit set provided.
   * */

  const {
    pixelScale = 1, // pixels per meter
    pixelOffset = 0,
    minHeight = 5,
    heightMethod = HeightMethod.Maximum,
    // Default height for when height is unknown
    defaultHeight = 100,
  } = options;

  // Get units associated with each surface
  // Note: we could hoist this if it proved useful for other scale types
  const domainInfo = getUnitsInAgeDomains(surfaces, units as ExtUnit[]);

  // Compute the height in pixels for each surface

  const surfaceHeights = [];
  const ageDomain = [];
  let lastHeight = pixelOffset;

  for (const domain of domainInfo) {
    if (lastHeight == pixelOffset) {
      surfaceHeights.push(lastHeight);
      ageDomain.push(domain.t_age);
    }

    // Approximate height based on units in this domain
    const units = domain.units;
    let unitHeightInfo: { unit: ExtUnit; height: number }[] = [];

    for (const unit of units) {
      const proportion = proportionOfUnitInDomain(
        unit,
        domain.t_age,
        domain.b_age,
      );
      const height = getApproximateHeight(unit, heightMethod);
      if (height != null) {
        unitHeightInfo.push({ unit, height: height * proportion });
      }
    }

    let thisHeight = 0;
    if (unitHeightInfo.length === 0) {
      thisHeight = defaultHeight; // Default height if no units with height info
    } else {
      // Normalize weights (take the mean)

      const meanHeight =
        unitHeightInfo.reduce((sum, d) => sum + d.height, 0) /
        unitHeightInfo.length;

      if (meanHeight == 0) {
        thisHeight = defaultHeight; // Arbitrary height for zero-height intervals
      } else if (meanHeight < minHeight) {
        thisHeight = minHeight; // Minimum height
      } else {
        thisHeight = meanHeight;
      }
    }

    lastHeight += thisHeight;
    surfaceHeights.push(lastHeight);
    ageDomain.push(domain.b_age);
  }

  // Build a piecewise linear scale mapping age to pixel height
  const pixelRange = surfaceHeights.map((h) => h * pixelScale);

  const scale = scaleLinear().domain(ageDomain).range(pixelRange);

  const heightDomain = surfaceHeights.map((h) => lastHeight - h);

  const heightScale = scaleLinear().domain(heightDomain).range(pixelRange);

  const domain: [number, number] = [
    ageDomain[ageDomain.length - 1],
    ageDomain[0],
  ];

  return {
    scale,
    pixelScale: null, // pixels per unit
    domain,
    pixelHeight: Math.abs(pixelRange[pixelRange.length - 1] - pixelRange[0]),
    heightScale,
  };
}

export function buildScaleFromSurfacesSimple(
  surfaces: BaseSurface[],
  options: HybridScaleOptions = {},
): PackageScaleInfo {
  /** Build a variable age scale that places age surfaces equally far apart in height space.
   * It is presumed that gaps are already removed from the unit set provided.
   * */

  const { pixelScale = 30 } = options;

  const domain: [number, number] = [
    surfaces[surfaces.length - 1].age,
    surfaces[0].age,
  ];
  // Compute the height in pixels for each surface

  const surfaceHeights = surfaces.map((surface, i) => {
    return i * pixelScale;
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
