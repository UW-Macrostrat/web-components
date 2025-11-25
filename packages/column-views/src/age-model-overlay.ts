/** An in-development overlay for a column's age model.
 *
 * Age model info:
 *       {
 *         "boundary_id": 8049,
 *         "col_id": 432,
 *         "section_id": 3104,
 *         "interval_id": 268,
 *         "interval_name": "Calymmian",
 *         "age_bottom": 1600,
 *         "age_top": 1400,
 *         "rel_position": 0.85,
 *         "model_age": 1430,
 *         "boundary_status": "absolute",
 *         "boundary_type": "",
 *         "boundary_position": null,
 *         "unit_below": 11541,
 *         "unit_above": 0,
 *         "ref_id": 217
 *       },
 *
 * */

import hyper from "@macrostrat/hyper";
import styles from "./age-model-overlay.module.sass";
import { useAPIResult } from "@macrostrat/ui-components";
import { useCompositeScale, useMacrostratUnits } from "./data-provider";
import { ExtUnit } from "./prepare-units/helpers";
import { PackageScaleInfo } from "./prepare-units/composite-scale";
import { scaleLinear } from "d3-scale";
const h = hyper.styled(styles);

interface AgeModelSurface {
  boundary_id: number;
  col_id: number;
  section_id: number;
  interval_id: number;
  interval_name: string;
  age_bottom: number;
  age_top: number;
  rel_position: number;
  model_age: number;
  boundary_status: "absolute" | "relative" | "modeled";
  boundary_type: string;
  boundary_position: null | number;
  unit_below: number;
  unit_above: number;
  ref_id: number;
}

export function BoundaryAgeModelOverlay() {
  const col_id = useMacrostratUnits()?.[0]?.col_id;
  const scale = useCompositeScale();

  const ageModel = useAPIResult(
    "https://dev.macrostrat.org/api/v2/age_model",
    { col_id },
    (res) => res.success.data,
  );

  if (ageModel == null) {
    return null;
  }

  return h(
    "div.boundary-age-model",
    ageModel.map((surface) => {
      const height = scale(surface.model_age);

      return h("div.boundary-age-model-surface", {
        key: surface.boundary_id,
        style: { top: `${height}px` },
      });
    }),
  );
}

interface BaseSurface {
  index: number;
  age: number;
  units_below: number[];
  units_above: number[];
}

function buildColumnSurfaces(
  units: ExtUnit[],
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
  mergedSurfaces.sort((a, b) => b.age - a.age);

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

function buildVariableAgeScale(
  units: ExtUnit[],
  opts: VariableAgeScaleOptions,
): PackageScaleInfo[] {
  /** Build a variable age scale that places age surfaces equally far apart in height space */
  const { tolerance = 0.001, domainHeight = 10 } = opts;
  const surfaces = buildColumnSurfaces(units, tolerance);
  const domainUnitInfo = getUnitsInAgeDomains(surfaces, units);

  const scaleInfo: PackageScaleInfo[] = [];
  for (let i = 0; i < domainUnitInfo.length; i++) {
    const domain = domainUnitInfo[i];
    scaleInfo.push({
      domain: [domain.b_age, domain.t_age],
      pixelHeight: 1,
      scale: scaleLinear(),
    });
  }
  return scaleInfo;
}

export function ComputedSurfacesOverlay() {
  /** Overlay showing age surfaces. This is like the boundary age model overlay but
   * it is computed on the fly from unit tops and bottoms.
   */
  const units = useMacrostratUnits();
  const surfaces = buildColumnSurfaces(units);
  const scale = useCompositeScale();

  return h(
    "div.boundary-age-model",
    surfaces.map((surface) => {
      const height = scale(surface.age);
      return h("div.boundary-age-model-surface", {
        key: surface.index,
        style: { top: `${height}px` },
      });
    }),
  );
}
