import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react-vite";
import { scaleLinear } from "@visx/scale";
import { useMemo } from "react";
import {
  Timescale,
  TimescaleOrientation,
  useZoomableScale,
  type TimescaleClickData,
} from "../src";

/**
 * Click-to-zoom timescale (Scope A prototype for the "Age scale transition
 * animations" feature area). The `Timescale` is already fully scale-driven, so
 * a single `d3` zoom transform (via `useZoomableScale`) is enough to animate a
 * zoom/pan: clicking an interval eases the visible age span to that interval,
 * and "Reset" eases back to the full extent. No changes to `Timescale` itself.
 */
function AnimatedTimescale(props: {
  ageRange?: [number, number];
  length?: number;
  levels?: [number, number];
  orientation?: TimescaleOrientation;
  duration?: number;
  padding?: number;
}) {
  const {
    ageRange = [1000, 0],
    length = 700,
    levels = [1, 4],
    orientation = TimescaleOrientation.VERTICAL,
    duration = 750,
    padding = 24,
  } = props;

  // The full extent we can zoom back out to. Range is pixels along the axis;
  // the hook only ever changes the *domain* under a transform, so `length`
  // stays fixed as the span animates.
  const baseScale = useMemo(
    () => scaleLinear({ domain: ageRange, range: [0, length] }),
    [ageRange.join(","), length],
  );

  // `padding` is in pixels, so the gutter around a zoom target looks the same
  // at every zoom level; it collapses at the ends of the full extent.
  const zoom = useZoomableScale(baseScale, { duration, padding });

  const onClick = (_evt: Event, data: TimescaleClickData) => {
    if (data.interval == null) return;
    zoom.zoomToInterval(data.interval);
  };

  const [older, younger] = zoom.domain;
  const isVertical = orientation === TimescaleOrientation.VERTICAL;

  return h("div", { style: { display: "flex", flexDirection: "column", gap: 12, padding: 16 } }, [
    h("div", { style: { display: "flex", alignItems: "center", gap: 12 } }, [
      h(
        "button",
        { onClick: () => zoom.reset(), disabled: zoom.isFullExtent },
        "Reset to full extent",
      ),
      h(
        "code",
        `${older.toFixed(1)} – ${younger.toFixed(1)} Ma${zoom.isAnimating ? " (animating…)" : ""}`,
      ),
    ]),
    h(
      "div",
      { style: isVertical ? { height: length } : { width: length } },
      h(Timescale, {
        scale: zoom.scale,
        orientation,
        levels,
        onClick,
        absoluteAgeScale: true,
      }),
    ),
    h(
      "p",
      { style: { maxWidth: 640, color: "var(--secondary-color, #666)" } },
      "Click any interval to zoom to it. A fixed pixel padding keeps neighbors " +
        "reachable at either end, collapsing where the span meets the oldest or " +
        "youngest age. Use Reset to ease back out.",
    ),
  ]);
}

export default {
  title: "Timescale/Animated timescale",
  component: AnimatedTimescale,
  parameters: {
    docs: {
      description: {
        component:
          "Prototype for animated traversal of geologic time. Clicking a " +
          "timescale interval animates a `d3`-driven zoom to that span; the " +
          "transform is the source of truth, so this is reusable to drive " +
          "pickers and (later) shared across correlated columns.",
      },
    },
  },
  argTypes: {
    length: { control: { type: "number" } },
    duration: { control: { type: "number", min: 0, max: 3000, step: 50 } },
    padding: { control: { type: "number", min: 0, max: 200, step: 4 } },
    orientation: {
      control: { type: "radio" },
      options: [TimescaleOrientation.VERTICAL, TimescaleOrientation.HORIZONTAL],
    },
  },
} as Meta<typeof AnimatedTimescale>;

export const Vertical = {
  args: {
    ageRange: [1000, 0],
    length: 700,
    levels: [1, 4],
    orientation: TimescaleOrientation.VERTICAL,
    duration: 750,
    padding: 24,
  },
};

export const Horizontal = {
  args: {
    ageRange: [541, 0],
    length: 1000,
    levels: [1, 5],
    orientation: TimescaleOrientation.HORIZONTAL,
    duration: 750,
    padding: 32,
  },
};
