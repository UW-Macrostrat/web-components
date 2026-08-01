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

function useColumnUnits(col_id: number) {
  return useAPIResult(
    "https://dev.macrostrat.org/api/v2/units",
    { col_id, response: "long", status_code: "active", show_position: true },
    (res) => res.success.data,
  );
}

function SemanticZoomColumn({ id, base, exponent, maxUnitHeight, ...rest }: any) {
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
  const fullSpan = fullExtent.b_age - fullExtent.t_age;
  const span = window.b_age - window.t_age;
  const targetUnitHeight = targetUnitHeightForSpan(span, fullSpan, {
    base,
    exponent,
    max: maxUnitHeight,
  });
  const timescaleLevels = levelsForSelected(selectedLevel);

  const onClickTimescaleInterval = (_evt: Event, data: TimescaleClickData) => {
    const interval = data?.interval;
    if (interval == null || interval.lvl == null) return;
    if (stack.length === 0 || interval.lvl > selectedLevel) {
      // Nothing selected yet, or a finer interval was clicked → drill in.
      setStack([...stack, interval]);
      zoom.zoomToInterval(interval);
    } else {
      // A click at the selected level or coarser → zoom out a level. Level-based
      // (not identity-based) so it's robust to the zoom buffer: clicking the
      // selected interval, an adjacent same-level one, or a coarser one all zoom
      // out. Popping past the root returns to the full extent.
      const next = stack.slice(0, -1);
      setStack(next);
      const parent = next[next.length - 1] ?? null;
      if (parent != null) zoom.zoomToInterval(parent);
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
        `span ${span.toFixed(1)} Myr · zoom ${(fullSpan / span).toFixed(1)}× → target unit height ${targetUnitHeight.toFixed(0)} px · levels ${timescaleLevels[0]}–${timescaleLevels[1]}`,
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
