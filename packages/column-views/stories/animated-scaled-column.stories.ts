import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react-vite";
import { useMemo } from "react";
import { Button, ButtonGroup, Spinner } from "@blueprintjs/core";
import { useAPIResult } from "@macrostrat/ui-components";
import "@macrostrat/style-system";
import { Column, useAnimatedAgeWindow, type AgeWindow } from "../src";

/**
 * Derive a `pixelScale` (px/Myr) from the visible age span so the column's
 * pixel height stays within `[minHeight, maxHeight]`: a small window is floored
 * (details don't collapse into a sliver) and all of geologic time is capped
 * (the column doesn't grow to many thousands of pixels).
 *
 * `pixelScale = clamp(base, minHeight/span, maxHeight/span)`:
 *  - small span → `minHeight/span` (large) dominates → height pinned to minHeight
 *  - large span → `maxHeight/span` (small) dominates → height pinned to maxHeight
 *  - in between → the natural `base` density
 */
function boundedPixelScale(
  span: number,
  opts: { base: number; minHeight: number; maxHeight: number },
): number {
  const { base, minHeight, maxHeight } = opts;
  if (span <= 0) return base;
  const floor = minHeight / span;
  const cap = maxHeight / span;
  return Math.min(Math.max(base, floor), cap);
}

function useColumnUnits(col_id: number) {
  return useAPIResult(
    "https://dev.macrostrat.org/api/v2/units",
    { col_id, response: "long", status_code: "active", show_position: true },
    (res) => res.success.data,
  );
}

function AnimatedScaledColumn({ id, base, minHeight, maxHeight, ...rest }: any) {
  const units = useColumnUnits(id);

  const fullExtent = useMemo<AgeWindow | null>(() => {
    if (units == null || units.length === 0) return null;
    return {
      t_age: Math.min(...units.map((u: any) => u.t_age)),
      b_age: Math.max(...units.map((u: any) => u.b_age)),
    };
  }, [units]);

  const zoom = useAnimatedAgeWindow({ fullExtent });

  if (units == null || fullExtent == null) {
    return h(Spinner);
  }

  const window = zoom.window ?? fullExtent;
  const span = window.b_age - window.t_age;
  const pixelScale = boundedPixelScale(span, { base, minHeight, maxHeight });

  // Presets spanning three orders of magnitude, derived from the data extent.
  const fullSpan = fullExtent.b_age - fullExtent.t_age;
  const presets: { label: string; window: AgeWindow }[] = [
    { label: "Full extent", window: fullExtent },
    {
      label: "Mid third",
      window: {
        t_age: fullExtent.t_age + fullSpan / 3,
        b_age: fullExtent.b_age - fullSpan / 3,
      },
    },
    {
      label: "Youngest ~20 Myr",
      window: {
        t_age: fullExtent.t_age,
        b_age: Math.min(fullExtent.t_age + 20, fullExtent.b_age),
      },
    },
  ];

  return h("div", { style: { display: "flex", flexDirection: "column", gap: 12 } }, [
    h("div", { style: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" } }, [
      h(
        ButtonGroup,
        presets.map((p) =>
          h(
            Button,
            { key: p.label, small: true, onClick: () => zoom.zoomToWindow(p.window) },
            p.label,
          ),
        ),
      ),
      h(
        "code",
        `span ${span.toFixed(1)} Myr → ${pixelScale.toFixed(2)} px/Myr → ~${Math.round(span * pixelScale)} px`,
      ),
    ]),
    h(Column, {
      units,
      t_age: window.t_age,
      b_age: window.b_age,
      // Density is a function of the span — a gentle auto-zoom that keeps the
      // rendered height bounded across small and huge time ranges.
      pixelScale,
      isTransitioning: zoom.isAnimating,
      ...rest,
    }),
  ]);
}

export default {
  title: "Column views/Stratigraphic column rendering",
  component: AnimatedScaledColumn,
  args: {
    id: 432,
    showLabelColumn: true,
    unconformityLabels: true,
    // Scaling-function knobs
    base: 2,
    minHeight: 400,
    maxHeight: 1200,
  },
  argTypes: {
    base: { control: { type: "number" }, description: "Natural density (px/Myr) in the mid-range" },
    minHeight: { control: { type: "number" }, description: "Floor on rendered column height (px)" },
    maxHeight: { control: { type: "number" }, description: "Cap on rendered column height (px)" },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Bounded-density navigation: `pixelScale` is derived from the visible " +
          "age span (`clamp(base, minHeight/span, maxHeight/span)`), so zooming " +
          "to a narrow interval floors the height (details expand) and zooming " +
          "to the full extent caps it (no runaway thousands-of-pixels column). " +
          "This is the joint domain+density 'auto-zoom' mode, in contrast to the " +
          "constant-density pan-and-contract of the other animated stories.",
      },
      story: { inline: false, iframeHeight: 700 },
    },
  },
} as Meta<typeof AnimatedScaledColumn>;

export const BoundedPixelHeight = {};
