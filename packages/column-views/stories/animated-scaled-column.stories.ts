import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react-vite";
import { useMemo, useState } from "react";
import { Button, Spinner } from "@blueprintjs/core";
import { useAPIResult } from "@macrostrat/ui-components";
import "@macrostrat/style-system";
import {
  Column,
  useAnimatedAgeWindow,
  MergeSectionsMode,
  type AgeWindow,
} from "../src";
import type { Interval, TimescaleClickData } from "@macrostrat/timescale";

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

/** Extend a window across its bounding unconformities to reveal `peekPx` pixels
 * of the neighboring sections' units above and below (Enhancement 2). This is a
 * *layout* consideration, so it's specified in pixels, not Myr: a fixed Myr
 * padding sweeps in a whole section of short-lived young units (e.g. a Myr of
 * Pleistocene) while barely nudging a long Mesozoic unit. Since the layout
 * targets ~`targetUnitHeight` px per unit, `peekPx` px of a neighbor unit is
 * `(peekPx / targetUnitHeight)` of its age span. Reaching into the neighbor's
 * *units* (not its empty age range) is what makes that section — and its
 * clickable timescale — render. */
function extendAcrossBoundingUnconformities(
  units: any[],
  w: AgeWindow,
  peekPx: number,
  targetUnitHeight: number,
): AgeWindow {
  if (peekPx <= 0 || targetUnitHeight <= 0) return w;
  const peekOfUnit = (u: any) => {
    const ageSpan = u.b_age - u.t_age;
    return Math.min((peekPx / targetUnitHeight) * ageSpan, ageSpan);
  };
  let { t_age, b_age } = w;
  const below = units
    .filter((u) => u.t_age >= b_age)
    .sort((a, b) => a.t_age - b.t_age)[0];
  if (below != null) b_age = below.t_age + peekOfUnit(below);
  const above = units
    .filter((u) => u.b_age <= t_age)
    .sort((a, b) => b.b_age - a.b_age)[0];
  if (above != null) t_age = above.b_age - peekOfUnit(above);
  return { t_age, b_age };
}

function useColumnUnits(col_id: number) {
  return useAPIResult(
    "https://dev.macrostrat.org/api/v2/units",
    { col_id, response: "long", status_code: "active", show_position: true },
    (res) => res.success.data,
  );
}

function SemanticZoomColumn({
  id,
  base,
  exponent,
  maxUnitHeight,
  realizedSpan,
  extendBoundingUnconformities,
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

  // Target window for an interval: nominal (interval ± buffer) by default, or —
  // in realized mode — snapped to the stratigraphy it actually contains, with an
  // optional peek into neighboring sections for navigation.
  const windowForInterval = (interval: Interval): AgeWindow => {
    const buffer = Math.max((interval.eag - interval.lag) * 0.25, 5);
    let w: AgeWindow = { t_age: interval.lag - buffer, b_age: interval.eag + buffer };
    if (realizedSpan) w = realizedWindow(units, w);
    if (extendBoundingUnconformities > 0) {
      // Convert the px extent to age using the density this window will render
      // at (targetUnitHeight for the content span, before the peek is added).
      const contentSpan = realizedSpan
        ? realizedContentSpan(units, w)
        : w.b_age - w.t_age;
      const tuh = targetUnitHeightForSpan(contentSpan, fullSpan, {
        base,
        exponent,
        max: maxUnitHeight,
      });
      w = extendAcrossBoundingUnconformities(
        units,
        w,
        extendBoundingUnconformities,
        tuh,
      );
    }
    return w;
  };

  const onClickTimescaleInterval = (_evt: Event, data: TimescaleClickData) => {
    const interval = data?.interval;
    if (interval == null || interval.lvl == null) return;
    if (stack.length === 0 || interval.lvl > selectedLevel) {
      // Nothing selected yet, or a finer interval was clicked → drill in.
      setStack([...stack, interval]);
      zoom.zoomToWindow(windowForInterval(interval));
    } else {
      // A click at the selected level or coarser → zoom out a level. Level-based
      // (not identity-based) so it's robust to the zoom buffer: clicking the
      // selected interval, an adjacent same-level one, or a coarser one all zoom
      // out. Popping past the root returns to the full extent.
      const next = stack.slice(0, -1);
      setStack(next);
      const parent = next[next.length - 1] ?? null;
      if (parent != null) zoom.zoomToWindow(windowForInterval(parent));
      else zoom.reset();
    }
  };

  const onReset = () => {
    setStack([]);
    zoom.reset();
  };

  // Bold the currently selected interval's text to make the click-to-zoom-out
  // affordance clear.
  const intervalStyle = (interval: Interval) => {
    if (selectedInterval != null && interval.oid === selectedInterval.oid) {
      return { fontWeight: "bold" };
    }
    return {};
  };

  return h("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, [
    h("div", { style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" } }, [
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
          ? `${selectedInterval.nam} — click a finer interval to drill in, or this level (or coarser) to zoom out`
          : "Click a timescale interval to zoom in.",
      ),
      h(
        "code",
        `${realizedSpan ? "content" : "span"} ${span.toFixed(1)} Myr · zoom ${(fullSpan / span).toFixed(1)}× → target unit height ${targetUnitHeight.toFixed(0)} px · levels ${timescaleLevels[0]}–${timescaleLevels[1]}`,
      ),
    ]),
    h(Column, {
      units,
      t_age: window.t_age,
      b_age: window.b_age,
      // Feed the zoom-dependent target to the existing content-aware layout; the
      // per-section pixelScale (and its floors) are derived from this.
      targetUnitHeight,
      // Timescale detail follows the selected level; layout is unaffected.
      timescaleLevels,
      // Bold the selected interval (click it to zoom out).
      timescaleIntervalStyle: intervalStyle,
      isTransitioning: zoom.isAnimating,
      onClickTimescaleInterval,
      ...rest,
    }),
  ]);
}

export default {
  title: "Column views/Stratigraphic column rendering",
  component: SemanticZoomColumn,
  args: {
    id: 432,
    showLabelColumn: true,
    unconformityLabels: true,
    // Semantic-zoom knobs
    base: 12,
    exponent: 0.5,
    maxUnitHeight: 120,
    realizedSpan: false,
    extendBoundingUnconformities: 0,
  },
  argTypes: {
    base: {
      control: { type: "number" },
      description: "Target unit height (px) at the full extent",
    },
    exponent: {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
      description: "How aggressively density ramps as you zoom in (0 = none, 1 = linear)",
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
    extendBoundingUnconformities: {
      control: { type: "number" },
      description:
        "Reveal this many px of the neighboring sections past the bounding unconformities, so adjacent timescale intervals stay navigable (pixel-based so young, short-lived intervals don't sweep in a whole section)",
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
          "timescale interval to drill in; click the bold (selected) interval to " +
          "zoom out a level; Reset returns to the full column.",
      },
      story: { inline: false, iframeHeight: 700 },
    },
  },
} as Meta<typeof SemanticZoomColumn>;

export const SemanticZoom = {};

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

/** Realized-span zoom that also extends across its bounding unconformities
 * (Enhancement 2). Zooming to a section reveals ~30 px of the next section's
 * units above and below, so those sections (and their timescale intervals)
 * render and stay clickable — otherwise unconformity bounds strand the next unit
 * outside the window and up/down timescale navigation dead-ends. The extent is
 * in pixels, so a young, short-lived interval (e.g. Pleistocene) reveals ~30 px,
 * not a whole section's worth of Myr. */
export const NavigableRealizedZoom = {
  args: {
    realizedSpan: true,
    extendBoundingUnconformities: 30,
  },
};
