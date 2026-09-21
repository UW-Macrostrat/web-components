/** How tall a column draws comes down to one quantity: **density**, the pixels
 * given to one unit of the axis — a Myr on an age column, a metre otherwise.
 *
 * Every option that sets a column's height names that quantity. Most are
 * floors, differing only in the units they're stated in: room for a unit,
 * for a section, or for the density itself. They combine by taking the
 * largest, so each says "at least this much", whichever ends up binding.
 */
import { ColumnAxisType } from "@macrostrat/column-components";
import type { UnitLong } from "@macrostrat/api-types";

export interface SectionDensityContext {
  /** The section's extent, in axis units */
  extent: number;
  /** Extents of the units the render window actually shows, each clipped to
   * it. Measuring what's on screen is what makes a unit-height rule mean the
   * same thing at every zoom depth. */
  unitExtents: number[];
  /** The section's units, unclipped, for a rule that needs more than their
   * extents */
  units: UnitLong[];
  sectionID?: number;
  axisType: ColumnAxisType;
}

/** Pixels per axis unit, for one section */
export type SectionDensity = (ctx: SectionDensityContext) => number;

export type SectionDensityLike = number | SectionDensity;

/** Room for a typical unit on screen: `px` tall, whatever its duration.
 *
 * "Typical" is the median of the visible extents, which is the only summary
 * that survives both tails. Unit durations are spread over orders of
 * magnitude: the arithmetic mean sits above any unit you would point at, so a
 * couple of long ones squeeze everything else below the target — and the
 * geometric mean fails the other way, since a single hair-thin unit (a
 * Holocene sliver beside a Pliocene terrace, say) drags the log-average down
 * and stretches the whole section to give that sliver its 20 pixels.
 */
export function unitHeight(px: number): SectionDensity {
  return (ctx) => px / typicalExtent(ctx.unitExtents);
}

/** Room for the section: `px` tall, whatever its extent. */
export function sectionHeight(px: number): SectionDensity {
  return (ctx) => px / ctx.extent;
}

/** A density stated outright, in pixels per axis unit. */
export function fixedDensity(px: number): SectionDensity {
  return () => px;
}

/** The rule that asks for the most room. Rules that don't resolve to a finite
 * number — a section of no extent, a window showing no units — are passed
 * over rather than swallowing the rest. */
export function atLeast(...rules: SectionDensityLike[]): SectionDensity {
  return (ctx) => {
    let density = 0;
    for (const rule of rules) {
      const value = resolveDensity(rule, ctx);
      if (!Number.isFinite(value)) continue;
      density = Math.max(density, value);
    }
    return density;
  };
}

export function resolveDensity(
  rule: SectionDensityLike,
  ctx: SectionDensityContext,
): number {
  if (typeof rule === "number") return rule;
  return rule(ctx);
}

function typicalExtent(extents: number[]): number {
  const sorted = extents.filter((d) => d > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return NaN;
  const mid = (sorted.length - 1) / 2;
  const lower = Math.floor(mid);
  const upper = Math.ceil(mid);
  return (sorted[lower] + sorted[upper]) / 2;
}

/** Mirrors the default in `sectionDensity` */
export const DEFAULT_TARGET_UNIT_HEIGHT = 20;
/** Small sections often have a unit or two, and no room for axis labels */
const DEFAULT_MIN_PIXEL_SCALE = 0.2;

/** What a section is sized by. Stated for the column as a whole, and again
 * per section by `sectionOptions` where one needs different treatment. */
export interface SectionSizeOptions {
  /** A density stated outright, in pixels per axis unit: every section drawn
   * to the same scale whatever it holds. Rarely what you want within one
   * column, and the only way to make several of them comparable.
   *
   * Left out — the usual case — the density comes from the section's own
   * units, via `targetUnitHeight` and the floors. Set, it *is* the density:
   * the floors don't apply, since they would undo the scale you stated.
   *
   * It also takes a rule, for what the options here can't describe.
   *
   * This one is stated in whatever the axis measures, so it means a different
   * thing on an age axis than on a depth one. A view that switches between
   * them wants `pixelsPerMyr` and `pixelsPerMeter` instead. */
  pixelScale?: SectionDensityLike;
  /** Pixels per million years, on an age axis.
   *
   * The axis-specific spellings of `pixelScale`, and what to reach for when
   * the axis can change under you: useful values differ by orders of
   * magnitude between the two, so one number cannot serve both, any more than
   * `t_age` could serve as `t_pos`. Both can be held at once — the axis picks
   * — and either takes precedence over `pixelScale`. */
  pixelsPerMyr?: number;
  /** Pixels per metre, on a depth or height axis. Also the scale for an
   * approximate-height column, whose units are metres of measured thickness
   * however its axis is labeled. */
  pixelsPerMeter?: number;
  /** Room for a typical unit on screen. The knob that usually decides a
   * column, and the one to reach for to draw it larger or smaller. */
  targetUnitHeight?: number;
  /** Room for a section, however little it holds */
  minSectionHeight?: number;
  /** A floor on the density itself */
  minPixelScale?: number;
}

/** Sizing for one section, or a rule that works it out from what the section
 * holds. What it returns overrides the column-wide options for that section;
 * anything it leaves out keeps the column's value. */
export type SectionOptionsLike =
  | SectionSizeOptions
  | ((ctx: SectionDensityContext) => SectionSizeOptions);

export interface SectionDensityOptions extends SectionSizeOptions {
  /** Sizing decided per section */
  sectionOptions?: SectionOptionsLike;
}

/** The density rule a column uses, resolved per section so that
 * `sectionOptions` gets to see a section before saying how to draw it. */
export function sectionDensity(opts: SectionDensityOptions): SectionDensity {
  const { sectionOptions } = opts;
  if (sectionOptions == null) {
    const rule = densityRule(opts);
    return (ctx) => rule(ctx);
  }

  return (ctx) => {
    let overrides = sectionOptions;
    if (typeof sectionOptions === "function") overrides = sectionOptions(ctx);
    return densityRule({ ...opts, ...overrides })(ctx);
  };
}

/** The floors, combined: whichever asks for the most room wins. */
function densityRule(opts: SectionSizeOptions): SectionDensity {
  const {
    targetUnitHeight = DEFAULT_TARGET_UNIT_HEIGHT,
    minPixelScale = DEFAULT_MIN_PIXEL_SCALE,
    minSectionHeight,
  } = opts;

  const derived = atLeast(
    unitHeight(targetUnitHeight),
    fixedDensity(minPixelScale),
    sectionHeight(minSectionHeight ?? targetUnitHeight ?? 0),
  );

  return (ctx) => {
    // A density given outright answers for the section by itself. The floors
    // exist to keep a column readable when its own contents decide the
    // density; a scale you stated is a decision already made, and a floor
    // would quietly undo it — which is the whole point of stating one,
    // usually so that several columns can be compared.
    const stated = statedDensity(opts, ctx.axisType);
    if (typeof stated === "function") return stated(ctx);
    if (stated != null) return stated;
    return derived(ctx);
  };
}

/** The density this axis was given, if any. The axis-specific spellings win
 * over the generic one, which is what lets both be held while the axis
 * changes. */
export function statedDensity(
  opts: SectionSizeOptions,
  axisType: ColumnAxisType,
): SectionDensityLike | undefined {
  const { pixelScale, pixelsPerMyr, pixelsPerMeter } = opts;
  if (axisType === ColumnAxisType.AGE) {
    return pixelsPerMyr ?? pixelScale;
  }
  return pixelsPerMeter ?? pixelScale;
}
