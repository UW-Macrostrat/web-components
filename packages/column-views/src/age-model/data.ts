/** Data hooks for a column's age model. */
import { useMemo } from "react";
import { useAPIResult } from "@macrostrat/ui-components";
import { useMacrostratBaseURL } from "@macrostrat/data-provider";
import type { UnitLong } from "@macrostrat/api-types";
import { useMacrostratColumnData, useMacrostratUnits } from "../data-provider";
import {
  type AgeModelBoundary,
  type ColumnSurface,
  surfacesFromBoundaries,
  surfacesFromUnits,
} from "./types";

export const AGE_MODEL_ROUTE = "/age_model";

/** The age-model boundaries of a column, from `/age_model?col_id=` on the
 * API the enclosing `MacrostratDataProvider` points at (production when there
 * is none). `null` while loading or when `col_id` is not set. */
export function useColumnAgeModel(
  col_id: number | null | undefined,
): AgeModelBoundary[] | null {
  const baseURL = useMacrostratBaseURL();
  const params = useMemo(() => ({ col_id }), [col_id]);
  let route: string | null = null;
  if (col_id != null) {
    route = baseURL + AGE_MODEL_ROUTE;
  }
  return useAPIResult(route, params, unwrapAgeModel) ?? null;
}

function unwrapAgeModel(res: any): AgeModelBoundary[] {
  return res?.success?.data ?? [];
}

/** Where a column's surfaces came from */
export type SurfacesSource = "provided" | "age-model" | "derived" | "loading";

export interface UseColumnSurfacesOptions {
  /** Surfaces to show. When given, nothing is fetched. */
  surfaces?: ColumnSurface[] | null;
  /** The column whose age model to fetch. Defaults to the column being
   * rendered (read from its units). */
  col_id?: number | null;
  /** When the age model has no boundaries, derive surfaces from the units
   * instead (default `true`). */
  fallbackToUnits?: boolean;
}

export interface ColumnSurfacesData {
  surfaces: ColumnSurface[];
  source: SurfacesSource;
}

/** Resolve the surfaces to show for the enclosing `Column`: the ones passed
 * in, else the column's age model, else (optionally) surfaces derived from
 * its units. Must be used inside a `Column`. */
export function useColumnSurfaces(
  options: UseColumnSurfacesOptions = {},
): ColumnSurfacesData {
  const { surfaces: provided, col_id, fallbackToUnits = true } = options;
  const units = useMacrostratUnits() as UnitLong[] | undefined;
  const { axisType } = useMacrostratColumnData();

  let fetchID: number | null = null;
  if (provided == null) {
    fetchID = col_id ?? units?.[0]?.col_id ?? null;
  }
  const boundaries = useColumnAgeModel(fetchID);

  const fromAgeModel = useMemo(
    () => surfacesFromBoundaries(boundaries),
    [boundaries],
  );

  const derived = useMemo(() => {
    if (!fallbackToUnits) return [];
    return surfacesFromUnits(units, { axisType });
  }, [units, axisType, fallbackToUnits]);

  if (provided != null) {
    return { surfaces: provided, source: "provided" };
  }
  if (fetchID != null && boundaries == null) {
    return { surfaces: [], source: "loading" };
  }
  if (fromAgeModel.length > 0) {
    return { surfaces: fromAgeModel, source: "age-model" };
  }
  return { surfaces: derived, source: "derived" };
}
