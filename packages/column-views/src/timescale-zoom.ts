/** Click-to-zoom navigation over geologic time.
 *
 * `useTimescaleZoom` turns clicks on a column's timescale into an animated
 * age window: clicking an interval zooms to it, clicking the interval you are
 * already in zooms back out a level, and the timescale shows a sliding window
 * of levels that follows the selection, so finer intervals come into reach as
 * you drill. The result spreads straight onto a `Column`.
 */
import { type CSSProperties, useCallback, useMemo, useState } from "react";
import type {
  Interval,
  IntervalStyleBuilder,
  TimescaleClickData,
  TimescaleClickHandler,
} from "@macrostrat/timescale";
import { type AgeWindow, useAnimatedAgeWindow } from "./animated-age-window";

/** Coarsest level worth showing; level 0 is "all of geologic time" */
const MIN_TIMESCALE_LEVEL = 1;
/** Deepest level in the timescale (age/stage) */
const MAX_TIMESCALE_LEVEL = 5;
/** How many levels are shown at once */
const LEVEL_WINDOW = 3;
/** The level anchored on before an interval is picked. 3 (period) puts the
 * starting window at era–epoch, the levels a `Column` shows by default. */
const DEFAULT_LEVEL = 3;

const SELECTED_INTERVAL_STYLE: CSSProperties = { fontWeight: "bold" };

export interface UseTimescaleZoomOptions {
  /** The full data extent — the window zooming returns to. `null` until the
   * data (and hence the extent) is known. */
  fullExtent: AgeWindow | null;
  /** When false the hook reports no window and no column props, so a view can
   * offer zooming as an option without changing hook order (default `true`). */
  enabled?: boolean;
  /** How many timescale levels to show at once (default 3) */
  levelWindow?: number;
  /** The level to anchor the window on before an interval is picked
   * (default 3, period) */
  defaultLevel?: number;
  minLevel?: number;
  maxLevel?: number;
  /** Animation duration in ms */
  duration?: number;
  /** Style for the selected interval — the one whose click zooms out
   * (default bold) */
  selectedIntervalStyle?: CSSProperties;
}

/** Timescale and age-window props, ready to spread onto a `Column`. */
export interface TimescaleZoomColumnProps {
  showTimescale?: boolean;
  timescaleLevels?: [number, number];
  timescaleIntervalStyle?: IntervalStyleBuilder;
  onClickTimescaleInterval?: TimescaleClickHandler;
  t_age?: number;
  b_age?: number;
  isTransitioning?: boolean;
}

export interface TimescaleZoom {
  enabled: boolean;
  /** The rendered age window — `null` when disabled or before the extent is
   * known */
  window: AgeWindow | null;
  /** The drill path: coarse to fine, the last entry being the selection */
  intervals: Interval[];
  selectedInterval: Interval | null;
  /** Every interval in the selection: the one drilled to, plus any added by
   * shift-clicking. The window spans all of them. */
  selectedIntervals: Interval[];
  /** The levels the timescale should show, following the selection */
  timescaleLevels: [number, number];
  isFullExtent: boolean;
  isAnimating: boolean;
  /** Return to the full extent, clearing the drill path */
  reset(): void;
  zoomToInterval(interval: Interval): void;
  onClickTimescaleInterval: TimescaleClickHandler;
  timescaleIntervalStyle: (interval: Interval) => CSSProperties;
  columnProps: TimescaleZoomColumnProps;
}

export function useTimescaleZoom(
  options: UseTimescaleZoomOptions,
): TimescaleZoom {
  const {
    fullExtent,
    enabled = true,
    levelWindow = LEVEL_WINDOW,
    defaultLevel = DEFAULT_LEVEL,
    minLevel = MIN_TIMESCALE_LEVEL,
    maxLevel = MAX_TIMESCALE_LEVEL,
    duration,
    selectedIntervalStyle = SELECTED_INTERVAL_STYLE,
  } = options;

  const anim = useAnimatedAgeWindow({ fullExtent, duration });

  // The intervals drilled through; the last one is the current selection
  const [intervals, setIntervals] = useState<Interval[]>([]);
  // Intervals shift-clicked into the selection alongside it
  const [addedIntervals, setAddedIntervals] = useState<Interval[]>([]);
  const selectedInterval = intervals[intervals.length - 1] ?? null;

  const selectedIntervals = useMemo(() => {
    if (selectedInterval == null) return addedIntervals;
    return [selectedInterval, ...addedIntervals];
  }, [selectedInterval, addedIntervals]);

  const reset = useCallback(() => {
    setIntervals([]);
    setAddedIntervals([]);
    anim.reset();
  }, [anim.reset]);

  /** Take the interval clicked into (or out of) the selection, and span the
   * result — how you widen a window to the interval next door. */
  const extendToInterval = useCallback(
    (interval: Interval) => {
      let added = addedIntervals.filter((d) => d.oid !== interval.oid);
      const wasSelected = added.length !== addedIntervals.length;
      if (!wasSelected && interval.oid !== selectedInterval?.oid) {
        added = [...addedIntervals, interval];
      }
      setAddedIntervals(added);

      let selection = added;
      if (selectedInterval != null) {
        selection = [selectedInterval, ...added];
      }
      if (selection.length === 0) {
        anim.reset();
        return;
      }
      anim.zoomToWindow(intervalsWindow(selection));
    },
    [addedIntervals, selectedInterval, anim.zoomToWindow, anim.reset],
  );

  const zoomToInterval = useCallback(
    (interval: Interval) => {
      // Keep only the coarser intervals that actually contain this one, so
      // stepping sideways into a different parent (the last stage of the
      // Cambrian → the first of the Ordovician) doesn't strand the old one
      const containing = intervals.filter(
        (d) =>
          d.lvl < interval.lvl &&
          d.eag >= interval.eag &&
          d.lag <= interval.lag,
      );
      setIntervals([...containing, interval]);
      setAddedIntervals([]);
      anim.zoomToInterval(interval);
    },
    [intervals, anim.zoomToInterval],
  );

  const onClickTimescaleInterval = useCallback<TimescaleClickHandler>(
    (event: Event, data: TimescaleClickData) => {
      const interval = data?.interval;
      if (interval == null || interval.lvl == null) return;

      // Shift-click widens the window instead of moving it, so a selection can
      // grow into the interval next door
      if ((event as MouseEvent)?.shiftKey) {
        extendToInterval(interval);
        return;
      }

      // Clicking the interval you are in is the way back out: pop a level, or
      // return to the full extent past the root
      if (interval.oid === selectedInterval?.oid && addedIntervals.length === 0) {
        const next = intervals.slice(0, -1);
        setIntervals(next);
        const parent = next[next.length - 1] ?? null;
        if (parent == null) {
          anim.reset();
        } else {
          anim.zoomToInterval(parent);
        }
        return;
      }

      // Every other click navigates *to* the interval clicked, whatever its
      // rank: a finer one drills in, a neighbor moves along the timescale, a
      // coarser one zooms out to it
      zoomToInterval(interval);
    },
    [
      intervals,
      selectedInterval,
      addedIntervals,
      extendToInterval,
      zoomToInterval,
      anim.reset,
    ],
  );

  const timescaleIntervalStyle = useCallback(
    (interval: Interval): CSSProperties => {
      if (selectedIntervals.some((d) => d.oid === interval.oid)) {
        return selectedIntervalStyle;
      }
      return {};
    },
    [selectedIntervals, selectedIntervalStyle],
  );

  const levels = useMemo(() => {
    let level = defaultLevel;
    for (const interval of selectedIntervals) {
      if (interval.lvl != null) level = Math.max(level, interval.lvl);
    }
    return levelsForSelected(level, { levelWindow, minLevel, maxLevel });
  }, [selectedIntervals, defaultLevel, levelWindow, minLevel, maxLevel]);

  if (!enabled) {
    return {
      ...disabledZoom,
      selectedIntervals: [],
      timescaleLevels: levels,
      reset,
      zoomToInterval,
      onClickTimescaleInterval,
      timescaleIntervalStyle,
    };
  }

  const window = anim.window ?? fullExtent;

  return {
    enabled: true,
    window,
    intervals,
    selectedInterval,
    selectedIntervals,
    timescaleLevels: levels,
    isFullExtent: anim.isFullExtent,
    isAnimating: anim.isAnimating,
    reset,
    zoomToInterval,
    onClickTimescaleInterval,
    timescaleIntervalStyle,
    columnProps: {
      showTimescale: true,
      timescaleLevels: levels,
      timescaleIntervalStyle,
      onClickTimescaleInterval,
      t_age: window?.t_age,
      b_age: window?.b_age,
      isTransitioning: anim.isAnimating,
    },
  };
}

/** What the hook reports when zooming is switched off: no window, and no
 * props to change how the column renders. */
const disabledZoom: Pick<
  TimescaleZoom,
  | "enabled"
  | "window"
  | "intervals"
  | "selectedInterval"
  | "isFullExtent"
  | "isAnimating"
  | "columnProps"
> = {
  enabled: false,
  window: null,
  intervals: [],
  selectedInterval: null,
  isFullExtent: true,
  isAnimating: false,
  columnProps: {},
};

interface LevelWindowOptions {
  levelWindow: number;
  minLevel: number;
  maxLevel: number;
}

/** A fixed window of timescale levels that slides with the selected level —
 * one coarser for context, the rest finer to drill into. Clamped so the
 * useless level 0 is never shown. */
export function levelsForSelected(
  selectedLevel: number,
  options: LevelWindowOptions,
): [number, number] {
  const { levelWindow, minLevel, maxLevel } = options;
  const span = Math.max(levelWindow - 1, 0);
  const lo = Math.min(
    Math.max(selectedLevel - 1, minLevel),
    Math.max(maxLevel - span, minLevel),
  );
  return [lo, lo + span];
}

/** The window spanning a set of intervals. */
function intervalsWindow(intervals: Interval[]): AgeWindow {
  return {
    t_age: Math.min(...intervals.map((d) => d.lag)),
    b_age: Math.max(...intervals.map((d) => d.eag)),
  };
}

/** The age extent of a set of units, in the shape the age-window props take.
 * `null` for an empty or absent set. */
export function unitsAgeExtent(
  units: { t_age: number; b_age: number }[] | null | undefined,
): AgeWindow | null {
  if (units == null || units.length === 0) return null;
  return {
    t_age: Math.min(...units.map((d) => d.t_age)),
    b_age: Math.max(...units.map((d) => d.b_age)),
  };
}
