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
import { buildColumnSurfaces } from "./prepare-units/dynamic-scales";
import { ExtUnit } from "./prepare-units";
import { UnitLong } from "@macrostrat/api-types";
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
  const col_id = (useMacrostratUnits() as ExtUnit[])?.[0]?.col_id;
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

export function ComputedSurfacesOverlay() {
  /** Overlay showing age surfaces. This is like the boundary age model overlay but
   * it is computed on the fly from unit tops and bottoms.
   */
  const units = useMacrostratUnits() as UnitLong[];
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
