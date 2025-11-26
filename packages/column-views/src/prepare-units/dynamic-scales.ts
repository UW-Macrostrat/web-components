import { ExtUnit } from "./helpers";
import { UnitLong } from "@macrostrat/api-types";
import { PackageScaleInfo } from "./composite-scale";
import { scaleLinear } from "d3-scale";

export enum HybridScaleType {
  // An age-domain scale that puts equal vertical space between surfaces
  EquidistantSurfaces = "equidistant-surfaces",
  // A height-domain scale that is based on the average height of units between surfaces
  ApproximateHeight = "approximate-height",
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

interface HybridScaleOptions {
  pixelOffset?: number;
  pixelScale?: number;
  hybridScaleType?: HybridScaleType;
}

export function buildHybridScale<T extends UnitLong>(
  units: T[],
  options: HybridScaleOptions = {},
): PackageScaleInfo {
  const surfaces = buildColumnSurfaces(units);

  if (options.hybridScaleType === HybridScaleType.EquidistantSurfaces) {
    return buildScaleFromSurfacesSimple(surfaces, options);
  }

  return buildApproximateHeightScale(surfaces, units, options);
}

export function buildApproximateHeightScale(
  surfaces: BaseSurface[],
  units: UnitLong[],
  options: HybridScaleOptions = {},
): PackageScaleInfo {
  /** Build a variable age scale that places age surfaces equally far apart in height space.
   * It is presumed that gaps are already removed from the unit set provided.
   * */

  const { pixelScale = 30, pixelOffset = 0 } = options;

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

    const thisHeight = pixelScale;

    lastHeight += thisHeight;
    surfaceHeights.push(lastHeight);
    ageDomain.push(domain.b_age);
  }

  // Build a piecewise linear scale mapping age to pixel height
  const pixelRange = surfaceHeights;

  const scale = scaleLinear().domain(ageDomain).range(pixelRange);

  const domain = [ageDomain[ageDomain.length - 1], ageDomain[0]];

  return {
    scale,
    pixelScale: null, // pixels per unit
    domain,
    pixelHeight: Math.abs(pixelRange[pixelRange.length - 1] - pixelRange[0]),
  };
}

export function buildScaleFromSurfacesSimple(
  surfaces: BaseSurface[],
  options: HybridScaleOptions = {},
): PackageScaleInfo {
  /** Build a variable age scale that places age surfaces equally far apart in height space.
   * It is presumed that gaps are already removed from the unit set provided.
   * */

  const {
    hybridScaleType = HybridScaleType.EquidistantSurfaces,
    pixelScale = 30,
  } = options;

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
