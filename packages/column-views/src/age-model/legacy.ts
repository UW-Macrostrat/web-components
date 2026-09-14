/** Earlier, in-development overlays, kept so existing consumers keep working.
 * Both are now thin wrappers over `ColumnSurfaces`. */
import h from "@macrostrat/hyper";
import { useMemo } from "react";
import type { UnitLong } from "@macrostrat/api-types";
import { useMacrostratColumnData, useMacrostratUnits } from "../data-provider";
import { ColumnSurfaces } from "./surfaces";
import { surfacesFromUnits } from "./types";

/** @deprecated Use `ColumnSurfaces`, which also labels the surfaces and
 * styles them by boundary status. */
export function BoundaryAgeModelOverlay() {
  return h(ColumnSurfaces, {
    showLabels: false,
    extent: "column",
    fallbackToUnits: false,
  });
}

/** @deprecated Use `ColumnSurfaces` with `surfaces: surfacesFromUnits(units)`,
 * or rely on its default fallback to unit-derived surfaces. */
export function ComputedSurfacesOverlay() {
  const units = useMacrostratUnits() as UnitLong[];
  const { axisType } = useMacrostratColumnData();
  const surfaces = useMemo(
    () => surfacesFromUnits(units, { axisType }),
    [units, axisType],
  );
  return h(ColumnSurfaces, { surfaces, showLabels: false, extent: "column" });
}
