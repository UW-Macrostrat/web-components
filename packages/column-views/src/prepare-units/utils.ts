import type { BaseUnit, UnitLong } from "@macrostrat/api-types";
import {
  AgeRangeRelationship,
  compareAgeRanges,
} from "@macrostrat/stratigraphy-utils";
import { ColumnAxisType } from "@macrostrat/column-components";

const dt = 0.001;

export function unitsOverlap<T extends BaseUnit>(
  a: T,
  b: T,
  axisType: ColumnAxisType = ColumnAxisType.AGE,
  tolerance: number = 0.001
): boolean {
  const rel = compareAgeRanges(
    getUnitHeightRange(a, axisType),
    getUnitHeightRange(b, axisType),
    tolerance
  );
  return rel != AgeRangeRelationship.Disjoint;
}

interface PossiblyClippedUnit extends BaseUnit {
  // Internally created clipped positions
  t_clip_pos?: number;
  b_clip_pos?: number;
}

export function getUnitHeightRange(
  unit: PossiblyClippedUnit,
  axisType: ColumnAxisType
): [number, number] {
  switch (axisType) {
    case ColumnAxisType.AGE:
      return [unit.b_clip_pos ?? unit.b_age, unit.t_clip_pos ?? unit.t_age];
    case ColumnAxisType.DEPTH:
    case ColumnAxisType.ORDINAL:
    case ColumnAxisType.HEIGHT:
      return [unit.b_clip_pos ?? unit.b_pos, unit.t_clip_pos ?? unit.t_pos];
    default:
      throw new Error(`Unknown axis type: ${axisType}`);
  }
}

export const createUnitSorter = (axisType: ColumnAxisType) => {
  return (a: UnitLong, b: UnitLong) => {
    const a_pos = getUnitHeightRange(a, axisType);
    const b_pos = getUnitHeightRange(b, axisType);
    const d_top = a_pos[1] - b_pos[1];
    if (d_top != 0) {
      return d_top;
    }
    return a_pos[0] - b_pos[0];
  };
};

export function ensureArray<T>(x: T | T[]): T[] {
  if (Array.isArray(x)) {
    return x;
  }
  return [x];
}

export function ensureRealFloat(x: number | string | null): number | null {
  if (typeof x == "string") {
    x = parseFloat(x);
  }
  if (isNaN(x)) {
    return null;
  }
  return x;
}
