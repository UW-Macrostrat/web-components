import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react-vite";
import { useMemo } from "react";
import { Button, Spinner } from "@blueprintjs/core";
import "@macrostrat/style-system";
import {
  Column,
  MergeSectionsMode,
  unitsAgeExtent,
  useTimescaleZoom,
} from "../../src";
import { useColumnUnits } from "./utils";

function IntervalZoomColumn({ id, padding, ...rest }: any) {
  const units = useColumnUnits(id);
  const fullExtent = useMemo(() => unitsAgeExtent(units), [units]);

  // Click-to-zoom lives in the library: clicking an interval zooms to it,
  // clicking the one you're in zooms back out, and the timescale's level
  // window slides with the selection so finer intervals come into reach.
  const zoom = useTimescaleZoom({ fullExtent, defaultLevel: 2 });

  if (units == null || fullExtent == null) {
    return h(Spinner);
  }

  const window = zoom.window ?? fullExtent;
  const span = window.b_age - window.t_age;
  const [lo, hi] = zoom.timescaleLevels;

  let instructions = "Click a timescale interval to zoom in.";
  const selected = zoom.selectedInterval;
  if (selected != null) {
    instructions = `${selected.nam} — click a finer interval to drill in, a neighboring one to move along the timescale, or ${selected.nam} itself to zoom out`;
  }

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
              onClick: zoom.reset,
            },
            "Reset to full extent",
          ),
          h("span", instructions),
          h(
            "code",
            `${window.t_age.toFixed(2)}–${window.b_age.toFixed(2)} Ma (${span.toFixed(2)} Myr) · levels ${lo}–${hi}`,
          ),
        ],
      ),
      h(Column, {
        units,
        // The window is the only thing zooming changes. Density follows from it
        // and from `targetUnitHeight`, which the layout applies to the units
        // this window shows — so the column is drawn the same way whether you
        // animated here or set these ages directly.
        //
        // `columnProps` carries the window, the timescale levels, the click
        // handler and the bold styling of the selected interval.
        ...zoom.columnProps,
        // Reveal this many px of the abutting sections past the window, so
        // neighboring stratigraphy and its intervals stay navigable.
        windowPadding: padding,
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
