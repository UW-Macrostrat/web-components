/** Grain size, drawn as small differences in unit width.
 *
 * A unit's grain size is read off its dominant lithology (the largest `prop`; the
 * coarsest of a tie). An explicit grain-size attribute (`fine`, `coarse`, …) wins,
 * then a lithology name with a known texture (`conglomerate`, `grainstone`, …), then a
 * default for the lithology type. Units with no sedimentary grain size — igneous and
 * metamorphic rocks — are drawn at full width.
 */
import { ColumnAxisType, grainSizes } from "@macrostrat/column-components";
import type { UnitLithology } from "@macrostrat/api-types";
import h from "@macrostrat/hyper";
import { createContext, ReactNode, useContext, useMemo } from "react";

/** `auto` shows grain size on measured columns only. */
export type GrainsizeMode = "on" | "off" | "auto";

/** Whether a column is a measured section or core, or a composite built by age. */
export type ColumnType = "measured" | "composite";

/** The `ColumnType` of a v2 API `col_type` (`section` or `column`). */
export function columnTypeFromColType(colType: string | null | undefined) {
  if (colType == "section") return "measured";
  if (colType == "column") return "composite";
  return null;
}

export type GrainSize = (typeof grainSizes)[number];

/** Grain-size attributes, as named in `macrostrat.lith_atts` (type `grains`). */
const attributeGrainsize: Record<string, GrainSize> = {
  "very fine": "vf",
  fine: "f",
  medium: "m",
  coarse: "c",
  "very coarse": "vc",
  granule: "p",
  pebbly: "p",
  boulder: "p",
};

/** Lithologies with a characteristic texture. Carbonates follow Dunham's
 * classification, as measured sections conventionally plot them. */
const lithologyGrainsize: Record<string, GrainSize> = {
  // Mud
  shale: "ms",
  mudstone: "ms",
  claystone: "ms",
  clay: "ms",
  mud: "ms",
  argillite: "ms",
  pelite: "ms",
  "lime mudstone": "ms",
  micrite: "ms",
  calcilutite: "ms",
  chalk: "ms",
  // Silt
  siltstone: "s",
  silt: "s",
  loess: "s",
  wackestone: "s",
  calcisiltite: "s",
  packstone: "f",
  // Sand
  sandstone: "m",
  arenite: "m",
  "quartz arenite": "m",
  arkose: "m",
  subarkose: "m",
  wacke: "m",
  graywacke: "m",
  greywacke: "m",
  litharenite: "m",
  sublitharenite: "m",
  sand: "m",
  greensand: "m",
  grainstone: "m",
  oolite: "m",
  calcarenite: "m",
  grit: "c",
  boundstone: "c",
  bindstone: "c",
  bafflestone: "c",
  framestone: "c",
  // Gravel
  conglomerate: "p",
  breccia: "p",
  gravel: "p",
  diamictite: "p",
  diamicton: "p",
  tillite: "p",
  till: "p",
  rudstone: "p",
  floatstone: "p",
  coquina: "p",
};

/** Defaults by `lith_type`, for lithologies without a texture of their own. */
const typeGrainsize: Record<string, GrainSize> = {
  carbonate: "m",
  siliciclastic: "m",
  sedimentary: "m",
  evaporite: "ms",
  chemical: "ms",
  organic: "ms",
};

/** The grain size of a unit, or `null` where it has none. */
export function unitGrainsize(
  lithologies: UnitLithology[] | null | undefined,
): GrainSize | null {
  let best: GrainSize | null = null;
  let bestProp = -Infinity;
  for (const lith of lithologies ?? []) {
    const size = lithologyGrainsizeOf(lith);
    if (size == null) continue;
    const prop = lith.prop ?? 0;
    if (prop > bestProp || (prop == bestProp && coarser(size, best))) {
      best = size;
      bestProp = prop;
    }
  }
  return best;
}

/** How much grain size varies a unit's width. */
export interface GrainsizeOptions {
  /** Most pixels the finest grain size pulls a unit's right edge in by (default 100) */
  range?: number;
  /** The finest grain size keeps at least this fraction of a unit's width
   * (default 0.75) */
  minWidthFraction?: number;
}

interface GrainsizeScale {
  range: number;
  minWidthFraction: number;
}

const GrainsizeContext = createContext<GrainsizeScale | null>(null);

/** Turn grain-size widths on for the units below, per `mode` and the axis. */
export function GrainsizeProvider(
  props: GrainsizeOptions & {
    mode?: GrainsizeMode;
    axisType: ColumnAxisType;
    /** Decides `auto` where given; otherwise height and depth axes count as measured */
    columnType?: ColumnType | null;
    /** The unit column's width */
    width: number;
    children?: ReactNode;
  },
) {
  const {
    mode = "auto",
    axisType,
    columnType,
    width,
    range = 100,
    minWidthFraction = 0.75,
    children,
  } = props;
  const enabled = grainsizeEnabled(mode, axisType, columnType);
  const value = useMemo(() => {
    if (!enabled) return null;
    return {
      range: Math.min(range, (1 - minWidthFraction) * width),
      minWidthFraction,
    };
  }, [enabled, range, minWidthFraction, width]);
  return h(GrainsizeContext.Provider, { value }, children);
}

/** `bounds` with the right edge pulled in for the unit's grain size, keeping the
 * minimum width fraction of the unit itself (internal columns can be narrow). */
export function useGrainsizeBounds<T extends { width: number }>(
  division: { [key: string]: any },
  bounds: T,
): T {
  const options = useContext(GrainsizeContext);
  const inset = useGrainsizeInset(division?.lith);
  if (inset == 0 || options == null) return bounds;
  const limit = (1 - options.minWidthFraction) * bounds.width;
  return { ...bounds, width: bounds.width - Math.min(inset, limit) };
}

/** Pixels to pull a unit's right edge in by, for its grain size. */
export function useGrainsizeInset(
  lithologies: UnitLithology[] | null | undefined,
): number {
  const options = useContext(GrainsizeContext);
  return useMemo(() => {
    if (options == null) return 0;
    const size = unitGrainsize(lithologies);
    if (size == null) return 0;
    const steps = grainSizes.length - 1;
    return ((steps - grainSizes.indexOf(size)) / steps) * options.range;
  }, [options, lithologies]);
}

export function grainsizeEnabled(
  mode: GrainsizeMode,
  axisType: ColumnAxisType,
  columnType?: ColumnType | null,
): boolean {
  if (mode == "on") return true;
  if (mode == "off") return false;
  // A measured core can be drawn on an age axis and still show grain size
  if (columnType != null) return columnType == "measured";
  return axisType == ColumnAxisType.HEIGHT || axisType == ColumnAxisType.DEPTH;
}

function lithologyGrainsizeOf(lith: UnitLithology): GrainSize | null {
  for (const att of lith.atts ?? []) {
    const size = attributeGrainsize[att.toLowerCase()];
    if (size != null) return size;
  }
  const name = lith.name?.toLowerCase();
  if (name != null && name in lithologyGrainsize) {
    return lithologyGrainsize[name];
  }
  return typeGrainsize[lith.type?.toLowerCase()] ?? null;
}

function coarser(a: GrainSize, b: GrainSize | null): boolean {
  if (b == null) return true;
  return grainSizes.indexOf(a) > grainSizes.indexOf(b);
}
