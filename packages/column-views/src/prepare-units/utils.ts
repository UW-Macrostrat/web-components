import type { BaseUnit } from "@macrostrat/api-types";
import {
  AgeRangeRelationship,
  compareAgeRanges,
} from "@macrostrat/stratigraphy-utils";
import { ColumnAxisType } from "@macrostrat/column-components";
import { type ExtUnit, StratigraphicPackage } from "./helpers";
import {
  ColumnScaleOptions,
  CompositeColumnData,
  PackageLayoutData,
} from "./composite-scale";
import { ScaleContinuousNumeric } from "d3-scale";
import { HybridScaleType } from "./dynamic-scales";

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
