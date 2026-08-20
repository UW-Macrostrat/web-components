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

function IntervalZoomColumn({ id, padding, ...rest }: any) {
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
  // timescale detail window anchors on its level.
  const [stack, setStack] = useState<Interval[]>([]);
  const selectedInterval = stack.length > 0 ? stack[stack.length - 1] : null;
  const selectedLevel = selectedInterval?.lvl ?? DEFAULT_SELECTED_LEVEL;

  if (units == null || fullExtent == null) {
    return h(Spinner);
  }

  const window = zoom.window ?? fullExtent;
  const timescaleLevels = levelsForSelected(selectedLevel);

  const zoomTo = (interval: Interval) => {
    zoom.zoomToWindow({ t_age: interval.lag, b_age: interval.eag });
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
      (d) =>
        d.lvl < interval.lvl && d.eag >= interval.eag && d.lag <= interval.lag,
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

  const span = window.b_age - window.t_age;

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
            `${window.t_age.toFixed(2)}–${window.b_age.toFixed(2)} Ma (${span.toFixed(2)} Myr) · levels ${timescaleLevels[0]}–${timescaleLevels[1]}`,
          ),
        ],
      ),
      h(Column, {
        units,
        // The window is the only thing zooming changes. Density follows from it
        // and from `targetUnitHeight`, which the layout applies to the units
        // this window shows — so the column is drawn the same way whether you
        // animated here or set these ages directly.
        t_age: window.t_age,
        b_age: window.b_age,
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
  title: "Column views/Column animations/Interval zoom",
  component: IntervalZoomColumn,
  args: {
    id: 432,
    showLabelColumn: true,
    unconformityLabels: true,
    targetUnitHeight: 20,
    minSectionHeight: 50,
    padding: 20,
  },
  argTypes: {
    targetUnitHeight: {
      control: { type: "number" },
      description:
        "Height (px) to draw a typical *visible* unit at — applied to what the window shows, so it means the same thing at any zoom depth",
    },
    minSectionHeight: {
      control: { type: "number" },
      description:
        "Floor (px) on a section's rendered height; a section the window cuts short meets it by expanding its scale",
    },
    padding: {
      control: { type: "number" },
      description:
        "Padding (px) of the abutting sections revealed past the window, so adjacent intervals stay navigable across a bounding unconformity",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Click-to-zoom navigation over geologic time. Zooming animates only " +
          "the rendered `t_age`/`b_age`; the layout derives density from the " +
          "units that window shows, so units hold their target height as you " +
          "drill in and the column renders identically whether you animated to " +
          "a window or set it directly. Click a timescale interval to drill in, " +
          "a preceding/postdating one to move along the timescale; click the " +
          "bold (selected) interval to zoom out a level; Reset returns to the " +
          "full column.",
      },
      story: { inline: false, iframeHeight: 700 },
    },
  },
} as Meta<typeof IntervalZoomColumn>;

export const IntervalZoom = {};

/** All units merged into a single continuous scale (`mergeSections: ALL`) — no
 * unconformity breaks. Unconformities otherwise truncate the composite scale
 * before the base of the next interval, which interrupts timescale traversal;
 * this variant lets you traverse freely. */
export const SingleScale = {
  args: {
    mergeSections: MergeSectionsMode.ALL,
  },
};

/** No padding: the window is clipped exactly at the interval, so the abutting
 * sections disappear entirely and there's nothing adjacent to click. */
export const NoPadding = {
  args: {
    padding: 0,
  },
};

/** Twice the default padding, as a check that the revealed band scales with the
 * number rather than snapping to whole units or section heights — and that it
 * measures the same above and below. */
export const WidePadding = {
  args: {
    padding: 40,
  },
};
