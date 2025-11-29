import type { UnitLong } from "@macrostrat/api-types";
import type { ColumnAxisType } from "@macrostrat/column-components";
import type { ScaleContinuousNumeric } from "d3-scale";

export interface ColumnHeightScaleOptions {
  /** A fixed pixel scale to use for the section (pixels per Myr) */
  pixelScale?: number;
  /** The target height of a constituent unit in pixels, for dynamic
   * scale generation */
  targetUnitHeight?: number;
  /** Min height of a section in pixels. Will override minPixelScale in some cases. */
  minSectionHeight?: number;
  /** The minimum pixel scale to use for the section (pixels per Myr). This is mostly
   * needed because small sections (<1-2 units) don't necessarily have space to comfortably
   * render two axis labels */
  minPixelScale?: number;
  // Axis scale type
  axisType?: ColumnAxisType;
  // Unconformity height in pixels
  unconformityHeight?: number;
  // Whether to collapse unconformities that are less than a height threshold
  collapseSmallUnconformities?: boolean | number;
  // A continuous scale to use instead of generating one
  // TODO: discontinuous scales are not yet supported
  scale?: ScaleContinuousNumeric<number, number>;
  // Hybrid scale type.
  // This overrides parameters such as the axis type
  hybridScale?: HybridScaleDefinition;
}

export enum HybridScaleType {
  // An age-domain scale that puts equal vertical space between surfaces
  EquidistantSurfaces = "equidistant-surfaces",
  // A height-domain scale that is based on the average height of units between surfaces
  ApproximateHeight = "approximate-height",
}

export enum HeightMethod {
  Minimum = "minimum",
  Average = "average",
  Maximum = "maximum",
}

export interface HybridScaleOptions {
  pixelOffset?: number;
  pixelScale?: number;
}

export type ApproxHeightScaleOptions = {
  minHeight?: number;
  defaultHeight?: number;
  heightMethod?: HeightMethod;
};

export type HybridScaleDefinition =
  | ({
      type: HybridScaleType.ApproximateHeight;
    } & ApproxHeightScaleOptions)
  | {
      type: HybridScaleType.EquidistantSurfaces;
    };

export interface SectionScaleOptions extends ColumnHeightScaleOptions {
  axisType: ColumnAxisType;
  domain: [number, number];
}

/** Output of a section scale. For now, this assumes that the
 * mapping is linear, but it could be extended to support arbitrary
 * scale functions.
 */
export interface PackageScaleInfo {
  domain: [number, number];
  pixelHeight: number;
  // TODO: add a function
  scale: ScaleContinuousNumeric<number, number>;
  pixelScale?: number; // if it's a linear scale, this could be defined
  // Subsidiary scale for height mapping (for hybrid scales)
  heightScale?: ScaleContinuousNumeric<number, number>;
}

export type PackageScaleLayoutData = PackageScaleInfo & {
  // A unique key for the section to use in React
  key: string;
  offset: number;
  // How much to
  paddingTop: number;
};
export interface StratigraphicPackage {
  /** A collection of stratigraphic information organized in time, corresponding
   * to single or multiple columns. */
  t_age: number;
  b_age: number;
}

export interface SectionInfo<
  T extends UnitLong = ExtUnit,
> extends StratigraphicPackage {
  /** A time-bounded part of a single stratigraphic column. */
  section_id: number | number[];
  units: T[];
  b_pos?: number;
  t_pos?: number;
}

export interface ExtUnit extends UnitLong {
  bottomOverlap: boolean;
  overlappingUnits: number[];
  column?: number;
  /* Positions (ages or heights) where the unit is clipped to its containing section.
   * This is relevant if we are filtering by age/height/depth range.
   */
  t_clip_pos?: number;
  b_clip_pos?: number;
}

export type PackageLayoutData<T extends UnitLong = ExtUnit> = SectionInfo<T> & {
  scaleInfo: PackageScaleLayoutData;
  // A unique key for the section to use in React
  key: string;
};

export interface CompositeScaleData {
  totalHeight: number;
  sections: PackageScaleLayoutData[];
}

export interface ColumnScaleOptions extends ColumnHeightScaleOptions {
  axisType: ColumnAxisType;
  unconformityHeight: number;
}

export interface CompositeColumnData<T extends UnitLong = ExtUnit> extends Omit<
  CompositeScaleData,
  "sections"
> {
  sections: PackageLayoutData<T>[];
}
