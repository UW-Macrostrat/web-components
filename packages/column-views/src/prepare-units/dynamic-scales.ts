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

export function buildScaleFromSurfaces(
  surfaces: BaseSurface[],
  pixelOffset: number = 0, // height in pixels at which to start the scale
  pixelScale: number = 10, // pixels per unit
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
