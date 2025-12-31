import type { BaseUnit } from "@macrostrat/api-types";
import {
  AgeRangeRelationship,
  compareAgeRanges,
} from "@macrostrat/stratigraphy-utils";
import { ColumnAxisType } from "@macrostrat/column-components";
import { ScaleContinuousNumeric } from "d3-scale";
import type {
  ColumnScaleOptions,
  CompositeColumnData,
  ExtUnit,
  PackageLayoutData,
  StratigraphicPackage,
} from "./types";

const dt = 0.001;

export interface PrepareColumnOptions extends ColumnScaleOptions {
  axisType: ColumnAxisType;
  t_age?: number;
  b_age?: number;
  t_pos?: number;
  b_pos?: number;
  mergeSections?: MergeSectionsMode;
  collapseSmallUnconformities?: boolean | number;
  scale?: ScaleContinuousNumeric<any, any>;
}

export enum MergeSectionsMode {
  ALL = "all",
  OVERLAPPING = "overlapping",
}

export interface PreparedColumnData extends CompositeColumnData {
  sections: PackageLayoutData[];
  units: ExtUnit[];
}

interface UnitsOverlap {
  (
    a: StratigraphicPackage,
    b: StratigraphicPackage,
    axisType?: ColumnAxisType.AGE,
    tolerance?: number,
  ): boolean;
  (
    a: BaseUnit,
    b: BaseUnit,
    axisType: ColumnAxisType,
    tolerance?: number,
  ): boolean;
}

export const unitsOverlap: UnitsOverlap = function (
  a,
  b,
  axisType: ColumnAxisType = ColumnAxisType.AGE,
  tolerance: number = 0.001,
): boolean {
  const rel = compareAgeRanges(
    getUnitHeightRange(a, axisType),
    getUnitHeightRange(b, axisType),
    tolerance,
  );
  return rel != AgeRangeRelationship.Disjoint;
};

/** A more permissive overlap function in the age space */
export function agesOverlap(
  a: StratigraphicPackage,
  b: StratigraphicPackage,
  tolerance: number = dt,
): boolean {
  return unitsOverlap(a, b, ColumnAxisType.AGE, tolerance);
}

export interface PossiblyClippedUnit extends BaseUnit {
  // Internally created clipped positions
  t_clip_pos?: number;
  b_clip_pos?: number;
}

export function getUnitHeightRange(
  unit: PossiblyClippedUnit,
  axisType: ColumnAxisType,
  clipped: boolean = true,
): [number, number] {
  if (clipped) {
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
  } else {
    switch (axisType) {
      case ColumnAxisType.AGE:
        return [unit.b_age, unit.t_age];
      case ColumnAxisType.DEPTH:
      case ColumnAxisType.ORDINAL:
      case ColumnAxisType.HEIGHT:
        return [unit.b_pos, unit.t_pos];
      default:
        throw new Error(`Unknown axis type: ${axisType}`);
    }
  }
}

export function getPositionWithinUnit(
  position: number,
  unit: PossiblyClippedUnit,
  axisType: ColumnAxisType,
): number | null {
  /** Translate a relative position (0-1) within a unit to an absolute position
   * within the unit's height range. If the unit is clipped, null values will be
   * returned for positions outside the clip range
   */
  if (position < 0 || position > 1) {
    throw new Error(`Position must be between 0 and 1: ${position}`);
  }

  const [pos_bottom, pos_top] = getUnitHeightRange(unit, axisType, false);
  const abs_pos = pos_bottom + position * (pos_top - pos_bottom);

  // If clipped, check if abs_pos is within the clipped range
  const [clip_bottom, clip_top] = getUnitHeightRange(unit, axisType, true);
  if (axisType === ColumnAxisType.AGE || axisType === ColumnAxisType.DEPTH) {
    // Invert for age/depth axes
    if (abs_pos > clip_bottom || abs_pos < clip_top) {
      return null;
    }
  } else {
    if (abs_pos < clip_bottom || abs_pos > clip_top) {
      return null;
    }
  }

  return abs_pos;
}

export const createUnitSorter = (axisType: ColumnAxisType) => {
  return (a: BaseUnit, b: BaseUnit) => {
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
