import type { UnitLong } from "@macrostrat/api-types";
import type { ColumnAxisType } from "@macrostrat/column-components";
import type { ScaleContinuousNumeric } from "d3-scale";
import type { SectionDensityLike, SectionOptionsLike } from "./density";

export interface ColumnHeightScaleOptions {
  /** A density stated outright: pixels per Myr on an age column, per metre
   * otherwise, every section drawn to the same scale whatever it holds.
   * Rarely what you want within one column, and the only way to make several
   * of them comparable.
   *
   * It also takes a rule — a function of the section's context — for the
   * cases the options here can't describe. A rule is in sole charge of its
   * section: the floors don't apply to it. */
  pixelScale?: SectionDensityLike;
  /** Room for a typical unit the render window shows: this many pixels tall,
   * whatever its duration. The knob that usually decides a column — reach for
   * it to draw one larger or smaller — and the one that expands it as you
   * zoom in, since the units on screen keep their size while the time they
   * cover shrinks. See `./density` for what "typical" means. */
  targetUnitHeight?: number;
  /** Room for a section: at least this many pixels tall, whatever its extent.
   * Small sections have a unit or two and little room for axis labels. */
  minSectionHeight?: number;
  /** A floor on the density itself, in pixels per axis unit. */
  minPixelScale?: number;
  /** Sizing for a section in particular, or a rule that works it out from
   * what the section holds. Whatever it returns overrides the options above
   * for that section; anything it leaves out keeps the column's value. */
  sectionOptions?: SectionOptionsLike;
  /** Padding around the `t_age`/`b_age` window, in **pixels** of neighboring
   * column: how much of the abutting sections to reveal past the window.
   *
   * Resolved after every section is laid out at full extent, so it's exact —
   * each section's own density and each crossed unconformity's fixed height are
   * spent from the pixel budget. Padding collapses where the column runs out.
   * Ignored for hybrid or externally-supplied scales. */
  windowPadding?: number;
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
  /** Named in the context a per-section rule sees */
  sectionID?: number;
  /** The requested render window, `[b_age, t_age]`, if there is one. Set
   * internally by `prepareColumnUnits`: unit density is derived from the units
   * this window actually shows, so `targetUnitHeight` describes the units you
   * can see at any zoom depth rather than the section's overall average. */
  visibleWindow?: [number, number];
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
  /** The requested render window, `[b_age, t_age]`, if there is one. Set
   * internally by `prepareColumnUnits`: unit density is derived from the units
   * this window actually shows, so `targetUnitHeight` describes the units you
   * can see at any zoom depth rather than the section's overall average. */
  visibleWindow?: [number, number];
}

export interface CompositeColumnData<T extends UnitLong = ExtUnit> extends Omit<
  CompositeScaleData,
  "sections"
> {
  sections: PackageLayoutData<T>[];
}
