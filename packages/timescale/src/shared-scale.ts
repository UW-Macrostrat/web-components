/** Several timescales drawn side by side against one age scale. */
import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { ScaleContinuousNumeric } from "d3-scale";
import { scaleLinear } from "@visx/scale";
import classNames from "classnames";

import { Timescale } from "./timescale";
import { useMacrostratTimescales } from "./intervals-api";
import { Interval, TimescaleOrientation } from "./types";
import h from "./shared-scale.module.sass";

export type AgeScale = ScaleContinuousNumeric<number, number>;

export interface TimescaleSpec {
  /** Macrostrat `timescale_id` */
  timescaleID: number;
  /** Header shown above the column */
  label?: string;
  /** Interval levels to show. Only the international timescale is nested;
   * the rest are flat, so `[1, 1]`. */
  levels?: [number, number];
  /** Read interval names horizontally rather than along the axis */
  wideLabels?: boolean;
  /** Width of the column's boxes (`--timescale-level-size`) */
  size?: string;
}

export interface SharedScaleTimescalesProps {
  timescales: TimescaleSpec[];
  /** The scale the columns are drawn against. Give this, or `ageRange` and
   * `length` for a linear one. */
  scale?: AgeScale;
  /** Oldest and youngest age of the window, in Ma */
  ageRange?: [number, number];
  /** Pixel height of that window */
  length?: number;
  /** Draw the age axis beside the first column (default `true`) */
  showAgeAxis?: boolean;
  className?: string;
}

/** Several timescales laid out side by side against one age scale.
 *
 * Alignment comes from the scale: each `Timescale` clips its intervals to the
 * scale's domain and sizes every box from it, so columns drawn from unrelated
 * timescales line up age-for-age. The scale need not be linear — a piecewise
 * one gives each boundary the same spacing whatever its duration — but an age
 * axis only makes sense for a linear scale.
 *
 * Only the first column draws the axis; the rest would draw the same ticks on
 * top of each other.
 */
export function SharedScaleTimescales(props: SharedScaleTimescalesProps) {
  const {
    timescales,
    scale: _scale,
    ageRange,
    length,
    showAgeAxis = true,
    className,
  } = props;

  const intervals = useMacrostratTimescales(
    useMemo(() => timescales.map((d) => d.timescaleID), [timescales]),
  );

  const scale = useMemo(() => {
    if (_scale != null) return _scale;
    if (ageRange == null || length == null) return null;
    return scaleLinear({ domain: ageRange, range: [0, length] });
  }, [_scale, ageRange?.[0], ageRange?.[1], length]);

  const showLabels = timescales.some((d) => d.label != null);

  if (scale == null) return null;

  return h(
    "div.shared-scale",
    { className },
    timescales.map((spec, i) =>
      h(SharedScaleTimescaleColumn, {
        key: spec.timescaleID,
        spec,
        scale,
        intervals: intervals.get(spec.timescaleID) ?? [],
        showLabel: showLabels,
        showAgeAxis: showAgeAxis && i === 0,
      }),
    ),
  );
}

export interface SharedScaleTimescaleColumnProps {
  spec: TimescaleSpec;
  scale: AgeScale;
  intervals: Interval[];
  /** Leave room for a header even when this column has no label, so that
   * columns beside each other start at the same height */
  showLabel?: boolean;
  showAgeAxis?: boolean;
}

/** One column of a shared-scale arrangement. Exported for layouts that place
 * the columns themselves — with an overlay across them, say. */
export function SharedScaleTimescaleColumn(
  props: SharedScaleTimescaleColumnProps,
) {
  const { spec, scale, intervals, showLabel = true, showAgeAxis = false } = props;
  const { label, levels = [1, 1], wideLabels = false } = spec;

  // `AgeAxis` reverses the range of the scale it is handed, so each column
  // works from its own copy rather than the one they are aligned to.
  const columnScale = useMemo(() => scale.copy(), [scale]);

  let size = spec.size;
  if (size == null && wideLabels) {
    size = "14em";
  }

  let style: CSSProperties = {};
  if (size != null) {
    style = { "--timescale-level-size": size } as CSSProperties;
  }

  return h("div.column", { className: classNames({ "wide-labels": wideLabels }) }, [
    h.if(showLabel)("div.column-label", label ?? ""),
    h(Timescale, {
      intervals,
      scale: columnScale,
      style,
      orientation: TimescaleOrientation.VERTICAL,
      absoluteAgeScale: true,
      levels,
      showAgeAxis,
    }),
  ]);
}
