/** Surfaces: the view model for a column's age model.
 *
 * A `ColumnSurface` is one horizontal boundary in a column. It is what the
 * surfaces view renders, and it is deliberately data-agnostic: a surface can
 * come from an `/age_model` boundary (`boundaryToSurface`), be derived from
 * unit tops and bottoms when a column has no age-model rows
 * (`surfacesFromUnits`), or be built by an editor from its own state.
 */
import type {
  AgeModelBoundary,
  BoundaryStatus,
  BoundaryType,
  UnitLong,
} from "@macrostrat/api-types";
import { ColumnAxisType } from "@macrostrat/column-components";

export type { AgeModelBoundary, BoundaryStatus, BoundaryType };

/** A boundary status, plus `derived` for surfaces computed from units rather
 * than stored in the age model. */
export type SurfaceStatus = BoundaryStatus | "derived";

/** The interval a surface is calibrated against */
export interface SurfaceCalibration {
  id: number;
  name: string;
  b_age: number;
  t_age: number;
}

export interface ColumnSurface {
  id: number | string;
  /** Modeled age of the surface (Ma) */
  age: number;
  /** Measured position (height or depth) along the column, when known */
  position?: number | null;
  status: SurfaceStatus;
  type: BoundaryType;
  /** The calibration interval, and the surface's position within it
   * (0 at the interval's base, 1 at its top) */
  calibration?: SurfaceCalibration | null;
  proportion?: number | null;
  unitsAbove: number[];
  unitsBelow: number[];
  section_id?: number | null;
  ref_id?: number | null;
  /** The API record, when the surface came from `/age_model` */
  boundary?: AgeModelBoundary;
}

export const surfaceStatuses: SurfaceStatus[] = [
  "absolute",
  "relative",
  "spike",
  "imposed",
  "modeled",
  "",
  "derived",
];

/** The statuses at which the age model was actually constrained — the tie
 * points — as opposed to surfaces whose age falls out of the model
 * (`modeled`), carries no status, or is merely derived from units. These are
 * the surfaces worth labeling by default. */
export const TIE_POINT_STATUSES: SurfaceStatus[] = [
  "absolute",
  "relative",
  "spike",
  "imposed",
];

export const surfaceStatusLabels: Record<SurfaceStatus, string> = {
  absolute: "Absolute",
  relative: "Relative",
  spike: "Spike",
  imposed: "Imposed",
  modeled: "Modeled",
  "": "Unspecified",
  derived: "Derived",
};

export const surfaceStatusDescriptions: Record<SurfaceStatus, string> = {
  absolute:
    "Independently dated; the age is authoritative and the interval position is derived from it",
  relative:
    "Calibrated to a position within a geologic interval; the age follows the timescale",
  spike: "Tied to a formally defined boundary point",
  imposed:
    "Interval-relative representation imposed on a boundary with no chronostratigraphic tie of its own (for instance, thickness interpolation)",
  modeled: "Interpolated by the age model between calibrated surfaces",
  "": "No status recorded",
  derived:
    "Computed from unit tops and bottoms; not stored in the column's age model",
};

/** A CSS-safe token for a status or type (`angular unconformity` →
 * `angular-unconformity`, `""` → `unspecified`). */
export function surfaceToken(value: string | null | undefined): string {
  if (value == null || value === "") return "unspecified";
  return value.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

/** Legacy `unit_boundaries` rows use `0` as the "no unit" sentinel. */
export function nullifyUnitID(id: number | null | undefined): number | null {
  if (id == null || id === 0) return null;
  return id;
}

export function boundaryToSurface(boundary: AgeModelBoundary): ColumnSurface {
  const above = nullifyUnitID(boundary.unit_above);
  const below = nullifyUnitID(boundary.unit_below);
  let calibration: SurfaceCalibration | null = null;
  if (boundary.interval_id != null) {
    calibration = {
      id: boundary.interval_id,
      name: boundary.interval_name,
      b_age: boundary.age_bottom,
      t_age: boundary.age_top,
    };
  }
  return {
    id: boundary.boundary_id,
    age: boundary.model_age,
    position: boundary.boundary_position,
    status: boundary.boundary_status ?? "",
    type: boundary.boundary_type ?? "",
    calibration,
    proportion: boundary.rel_position,
    unitsAbove: above == null ? [] : [above],
    unitsBelow: below == null ? [] : [below],
    section_id: boundary.section_id,
    ref_id: boundary.ref_id,
    boundary,
  };
}

/** Surfaces for a column's age-model boundaries, youngest first. */
export function surfacesFromBoundaries(
  boundaries: AgeModelBoundary[] | null | undefined,
): ColumnSurface[] {
  if (boundaries == null) return [];
  return boundaries.map(boundaryToSurface).sort((a, b) => a.age - b.age);
}

export interface SurfacesFromUnitsOptions {
  /** Surfaces closer than this (in the axis's units) are merged */
  tolerance?: number;
  /** Which unit field the surfaces are keyed on: ages for age columns,
   * measured positions for height and depth columns */
  axisType?: ColumnAxisType;
}

/** Derive surfaces from unit tops and bottoms. Every distinct top or bottom
 * becomes one surface with status `derived`; units sharing a boundary share
 * the surface. This is the fallback when a column has no `unit_boundaries`. */
export function surfacesFromUnits<T extends UnitLong>(
  units: T[] | null | undefined,
  options: SurfacesFromUnitsOptions = {},
): ColumnSurface[] {
  const { tolerance = 0.001, axisType = ColumnAxisType.AGE } = options;
  if (units == null) return [];
  const byPosition = isPositionAxis(axisType);

  const surfaces: ColumnSurface[] = [];

  function keyOf(surface: ColumnSurface): number | null {
    if (byPosition) return surface.position ?? null;
    return surface.age;
  }

  function addBound(unit: T, top: boolean) {
    const age = top ? unit.t_age : unit.b_age;
    const position = asNumber(top ? unit.t_pos : unit.b_pos);
    const key = byPosition ? position : age;
    if (key == null) return;

    let surface = surfaces.find((d) => {
      const k = keyOf(d);
      return k != null && Math.abs(k - key) < tolerance;
    });
    if (surface == null) {
      surface = {
        id: "",
        age,
        position,
        status: "derived",
        type: "",
        calibration: null,
        proportion: null,
        unitsAbove: [],
        unitsBelow: [],
        section_id: unit.section_id,
      };
      surfaces.push(surface);
    }
    // The unit whose top this is lies *below* the surface, and vice versa
    if (top) {
      surface.unitsBelow.push(unit.unit_id);
    } else {
      surface.unitsAbove.push(unit.unit_id);
    }
  }

  for (const unit of units) {
    addBound(unit, true);
    addBound(unit, false);
  }

  surfaces.sort((a, b) => compareAlongAxis(a, b, axisType));
  return surfaces.map((s, i) => ({ ...s, id: `derived-${i}` }));
}

/** The coordinate a surface is drawn at for a given axis type: its age for
 * age columns, its measured position for height and depth columns. `null`
 * when the surface has no coordinate on that axis. */
export function surfacePosition(
  surface: ColumnSurface,
  axisType: ColumnAxisType | null | undefined,
): number | null {
  if (isPositionAxis(axisType)) {
    return surface.position ?? null;
  }
  return surface.age ?? null;
}

export function isPositionAxis(
  axisType: ColumnAxisType | null | undefined,
): boolean {
  return (
    axisType === ColumnAxisType.HEIGHT || axisType === ColumnAxisType.DEPTH
  );
}

/** Order surfaces from the top of the column downwards. */
export function compareAlongAxis(
  a: ColumnSurface,
  b: ColumnSurface,
  axisType: ColumnAxisType | null | undefined,
): number {
  const pa = surfacePosition(a, axisType);
  const pb = surfacePosition(b, axisType);
  if (pa == null || pb == null) return 0;
  if (axisType === ColumnAxisType.HEIGHT) {
    // Heights increase upwards
    return pb - pa;
  }
  // Ages and depths increase downwards
  return pa - pb;
}

/** Percent of the way up its calibration interval, e.g. `85%`. */
export function formatProportion(
  proportion: number | null | undefined,
): string | null {
  if (proportion == null) return null;
  return `${Math.round(proportion * 100)}%`;
}

/** A short text label for a surface: its calibration ("Calymmian · 85%")
 * or, failing that, its age. */
export function surfaceLabel(surface: ColumnSurface): string {
  const { calibration } = surface;
  if (calibration != null) {
    const prop = formatProportion(surface.proportion);
    if (prop != null) {
      return `${calibration.name} · ${prop}`;
    }
    return calibration.name;
  }
  return formatAge(surface.age);
}

export function formatAge(age: number | null | undefined): string {
  if (age == null) return "";
  let value = age;
  let unit = "Ma";
  if (Math.abs(age) < 1) {
    value = age * 1000;
    unit = "ka";
  }
  const _value = value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return `${_value} ${unit}`;
}

function asNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return n;
}
