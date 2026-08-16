import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { Button, Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import {
  Column,
  useAnimatedAgeWindow,
  MergeSectionsMode,
  type AgeWindow,
} from "../../src";
import type { Interval, TimescaleClickData } from "@macrostrat/timescale";
import { useColumnUnits } from "./utils";

/** Deepest timescale level to ever show (age/stage). */
const MAX_TIMESCALE_LEVEL = 5;
/** Coarsest timescale level to ever show. Level 0 ("all of geologic time") is
 * implied and never rendered. */
const MIN_TIMESCALE_LEVEL = 1;
/** How many timescale levels to display at once. */
const LEVEL_WINDOW = 3;
/** Level to anchor on before anything is selected (full extent). */
const DEFAULT_SELECTED_LEVEL = 2;

/** A fixed 3-level window that slides with the selected interval's level, which
 * sits roughly in the middle (one coarser for context, one finer to drill in).
 * Clamped so the useless level 0 is never shown. */
function levelsForSelected(selectedLevel: number): [number, number] {
  const lo = Math.min(
    Math.max(selectedLevel - 1, MIN_TIMESCALE_LEVEL),
    MAX_TIMESCALE_LEVEL - (LEVEL_WINDOW - 1),
  );
  return [lo, lo + (LEVEL_WINDOW - 1)];
}

/**
 * Semantic zoom: as the visible window narrows, ask the *existing* layout to
 * draw things bigger by raising `targetUnitHeight` — rather than overriding
 * `pixelScale` directly. `minPixelScale`/`minSectionHeight` still act as the
 * "looks nice" floors, so this stays within the normal content-aware layout.
 *
 * `targetUnitHeight = min(base · (fullSpan / span)^exponent, max)`:
 *  - at the full extent → `base`
 *  - zoomed in (`span < fullSpan`) → grows smoothly with the zoom factor
 *  - `exponent` (0–1) tunes how aggressively density ramps (0.5 ≈ √)
 */
function targetUnitHeightForSpan(
  span: number,
  fullSpan: number,
  opts: { base: number; exponent: number; max: number },
): number {
  const { base, exponent, max } = opts;
  if (span <= 0 || fullSpan <= 0) return base;
  const zoomFactor = fullSpan / span; // ≥ 1 within the extent
  return Math.min(base * Math.pow(zoomFactor, exponent), max);
}

/** Snap a nominal age window to the extent of the *units* it actually contains,
 * clipped to the window. Two intervals that clip to the same stratigraphy yield
 * the same realized window — so zooming between them is a no-op (Enhancement 1).
 * Returns the nominal window unchanged when it contains no units. */
function realizedWindow(units: any[], nominal: AgeWindow): AgeWindow {
  const inWindow = units.filter(
    (u) => u.t_age < nominal.b_age && u.b_age > nominal.t_age,
  );
  if (inWindow.length === 0) return nominal;
  return {
    t_age: Math.max(nominal.t_age, Math.min(...inWindow.map((u) => u.t_age))),
    b_age: Math.min(nominal.b_age, Math.max(...inWindow.map((u) => u.b_age))),
  };
}

/** The total age actually covered by units within a window (clipped to it),
 * *excluding* unconformity gaps. This is the right basis for density: with
 * collapsed unconformities the raw age span is not proportional to rendered
 * content, so drilling to a recent interval whose window reaches across a big
 * unconformity would otherwise read as "barely zoomed" and never shrink the
 * older sections. */
function realizedContentSpan(units: any[], w: AgeWindow): number {
  let sum = 0;
  for (const u of units) {
    const top = Math.max(u.t_age, w.t_age);
    const bottom = Math.min(u.b_age, w.b_age);
    if (bottom > top) sum += bottom - top;
  }
  return sum;
}

function SemanticZoomColumn({
  id,
  base,
  exponent,
  maxUnitHeight,
  realizedSpan,
  padding,
  ...rest
}: any) {
  const units = useColumnUnits(id);

  const fullExtent = useMemo<AgeWindow | null>(() => {
    if (units == null || units.length === 0) return null;
    return {
      t_age: Math.min(...units.map((u: any) => u.t_age)),
      b_age: Math.max(...units.map((u: any) => u.b_age)),
    };
  }, [units]);

  const zoom = useAnimatedAgeWindow({ fullExtent });
  // A drill-down path of intervals. The last is the current selection; the
  // timescale detail window anchors on its level (independent of the layout).
  const [stack, setStack] = useState<Interval[]>([]);
  const selectedInterval = stack.length > 0 ? stack[stack.length - 1] : null;
  const selectedLevel = selectedInterval?.lvl ?? DEFAULT_SELECTED_LEVEL;

  if (units == null || fullExtent == null) {
    return h(Spinner);
  }

  const window = zoom.window ?? fullExtent;
  // Density is driven by the *realized content* (unit durations, gaps excluded)
  // in realized mode, so a window that reaches across a collapsed unconformity
  // still reads as zoomed-in and shrinks the older sections. Otherwise it's the
  // raw age span.
  const fullSpan = realizedSpan
    ? realizedContentSpan(units, fullExtent)
    : fullExtent.b_age - fullExtent.t_age;
  const span = realizedSpan
    ? realizedContentSpan(units, window)
    : window.b_age - window.t_age;
  const targetUnitHeight = targetUnitHeightForSpan(span, fullSpan, {
    base,
    exponent,
    max: maxUnitHeight,
  });
  const timescaleLevels = levelsForSelected(selectedLevel);

  // Target window for an interval: the nominal interval span, or — in realized
  // mode — snapped to the stratigraphy it actually contains. Revealing a margin
  // of the neighboring sections is the column's job (`windowPadding`, below),
  // resolved against the real laid-out section heights.
  const windowForInterval = (interval: Interval): AgeWindow => {
    const w: AgeWindow = { t_age: interval.lag, b_age: interval.eag };
    if (realizedSpan) return realizedWindow(units, w);
    return w;
  };

  const zoomTo = (interval: Interval) => {
    zoom.zoomToWindow(windowForInterval(interval));
  };

  const onClickTimescaleInterval = (_evt: Event, data: TimescaleClickData) => {
    const interval = data?.interval;
    if (interval == null || interval.lvl == null) return;

    // Clicking the interval you're already in is the only "zoom out": pop a
    // level, or return to the full extent past the root.
    if (selectedInterval != null && interval.oid === selectedInterval.oid) {
      const next = stack.slice(0, -1);
      setStack(next);
      const parent = next[next.length - 1] ?? null;
      if (parent != null) zoomTo(parent);
      else zoom.reset();
      return;
    }

    // Every other click navigates *to* the interval clicked, whatever its rank:
    // a finer one drills in, a preceding/postdating one at the same rank moves
    // along the timescale, a coarser one zooms out to it. The drill path keeps
    // only the coarser intervals that actually contain the new selection, so
    // stepping sideways into a different parent (say the last stage of the
    // Cambrian → the first of the Ordovician) doesn't strand the old one.
    const containing = stack.filter(
      (d) => d.lvl < interval.lvl && d.eag >= interval.eag && d.lag <= interval.lag,
    );
    setStack([...containing, interval]);
    zoomTo(interval);
  };

  const onReset = () => {
    setStack([]);
    zoom.reset();
  };

  // Bold the selected interval: it's the one whose click zooms out, whereas
  // every other interval navigates to itself.
  const intervalStyle = (interval: Interval) => {
    if (selectedInterval != null && interval.oid === selectedInterval.oid) {
      return { fontWeight: "bold" };
    }
    return {};
  };

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 12 } },
    [
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          },
        },
        [
          h(
            Button,
            {
              small: true,
              intent: "primary",
              disabled: zoom.isFullExtent,
              onClick: onReset,
            },
            "Reset to full extent",
          ),
          h(
            "span",
            selectedInterval != null
              ? `${selectedInterval.nam} — click a finer interval to drill in, a neighboring one to move along the timescale, or ${selectedInterval.nam} itself to zoom out`
              : "Click a timescale interval to zoom in.",
          ),
          h(
            "code",
            `${realizedSpan ? "content" : "span"} ${span.toFixed(1)} Myr · zoom ${(fullSpan / span).toFixed(1)}× → target unit height ${targetUnitHeight.toFixed(0)} px · levels ${timescaleLevels[0]}–${timescaleLevels[1]}`,
          ),
        ],
      ),
      h(Column, {
        units,
        t_age: window.t_age,
        b_age: window.b_age,
        // Feed the zoom-dependent target to the existing content-aware layout; the
        // per-section pixelScale (and its floors) are derived from this.
        targetUnitHeight,
        // Reveal this many px of the abutting sections past the window, so
        // neighboring stratigraphy and its intervals stay navigable.
        windowPadding: padding,
        // Timescale detail follows the selected level; layout is unaffected.
        timescaleLevels,
        // Bold the selected interval (click it to zoom out).
        timescaleIntervalStyle: intervalStyle,
        isTransitioning: zoom.isAnimating,
        onClickTimescaleInterval,
        ...rest,
      }),
    ],
  );
}

export default {
  title: "Column views/Column animations/Semantic zoom",
  component: SemanticZoomColumn,
  args: {
    id: 432,
    showLabelColumn: true,
    unconformityLabels: true,
    // Semantic-zoom knobs
    base: 12,
    exponent: 0.5,
    maxUnitHeight: 120,
    minSectionHeight: 200,
    realizedSpan: false,
    padding: 20,
  },
  argTypes: {
    base: {
      control: { type: "number" },
      description: "Target unit height (px) at the full extent",
    },
    exponent: {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
      description:
        "How aggressively density ramps as you zoom in (0 = none, 1 = linear)",
    },
    maxUnitHeight: {
      control: { type: "number" },
      description: "Cap on target unit height (px) when deeply zoomed in",
    },
    realizedSpan: {
      control: { type: "boolean" },
      description:
        "Snap the zoom to the stratigraphy the interval actually contains, so intervals clipping to the same units are a no-op",
    },
    padding: {
      control: { type: "number" },
      description:
        "Padding around the zoom target, in px of neighboring units — so adjacent sections and their timescale intervals stay navigable across a bounding unconformity (pixel-based so young, short-lived intervals don't sweep in a whole section)",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Semantic zoom via `targetUnitHeight`: narrowing the window raises the " +
          "target unit height by a smooth function of the zoom factor, so the " +
          "existing content-aware layout draws things bigger (with " +
          "`minPixelScale`/`minSectionHeight` still guarding small sections) — " +
          "rather than overriding `pixelScale` and bounding total height. Click a " +
          "timescale interval to drill in, a preceding/postdating one to move " +
          "along the timescale; click the bold (selected) interval to zoom out a " +
          "level; Reset returns to the full column.",
      },
      story: { inline: false, iframeHeight: 700 },
    },
  },
} as Meta<typeof SemanticZoomColumn>;

export const SemanticZoom = {};

/** No padding: the zoom target is clipped exactly at the interval, so the
 * abutting sections disappear entirely and there's nothing adjacent to click. */
export const NoPadding = {
  args: {
    padding: 0,
  },
};

/** 20 px of the abutting sections revealed past the window. Compare against
 * `NoPadding` and `WidePadding` — the revealed band should measure the stated
 * number of pixels regardless of zoom level, unit durations, or which side of
 * the window it's on. */
export const Padding = {
  args: {
    padding: 20,
  },
};

/** Twice the padding, as a check that the revealed band scales with the number
 * rather than snapping to whole units or section heights. */
export const WidePadding = {
  args: {
    padding: 40,
  },
};

/** Same interaction, but with all units merged into a single continuous scale
 * (`mergeSections: ALL`) — no unconformity breaks. Unconformities otherwise
 * truncate the composite scale before the base of the next interval, which
 * interrupts timescale traversal; this variant lets you traverse freely.
 * (Jumping across unconformity segments in the collapsed layout is future work.) */
export const SingleScale = {
  args: {
    mergeSections: MergeSectionsMode.ALL,
  },
};

/** Realized-span zoom (Enhancement 1): the zoom snaps to the stratigraphy the
 * clicked interval actually contains, rather than the nominal interval span. So
 * if a single 10 Myr unit is all that's present, drilling into finer intervals
 * that still contain it is a no-op (the interval just highlights in the
 * timescale) — you only zoom further once you start clipping the unit. */
export const RealizedZoom = {
  args: {
    realizedSpan: true,
  },
};

/** Realized-span zoom with padding across its bounding unconformities
 * (Enhancement 2). Zooming to a section reveals ~30 px of the next section's
 * units above and below, so those sections (and their timescale intervals)
 * render and stay clickable — otherwise unconformity bounds strand the next unit
 * outside the window and up/down timescale navigation dead-ends. The padding is
 * in pixels, so a young, short-lived interval (e.g. Pleistocene) reveals ~30 px,
 * not a whole section's worth of Myr. */
export const NavigableRealizedZoom = {
  args: {
    realizedSpan: true,
    padding: 30,
  },
};
