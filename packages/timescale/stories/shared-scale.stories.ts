import hyper from "@macrostrat/hyper";
import { scaleLinear } from "@visx/scale";
import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import classNames from "classnames";

import {
  Interval,
  SharedScaleTimescales,
  SharedScaleTimescaleColumn,
  type SharedScaleTimescalesProps,
  type TimescaleSpec,
  useMacrostratTimescales,
} from "../src";
import styles from "./shared-scale.stories.module.sass";

const h = hyper.styled(styles);

const DEFAULT_AGE_RANGE: [number, number] = [84, 72];
const DEFAULT_LENGTH = 1000;

const INTERNATIONAL_AGES: TimescaleSpec = {
  timescaleID: 11,
  label: "International ages",
  levels: [4, 5],
};

const meta: Meta<SharedScaleTimescalesProps> = {
  title: "Timescale/Shared scale",
  component: SharedScaleTimescales,
  args: {
    ageRange: DEFAULT_AGE_RANGE,
    length: DEFAULT_LENGTH,
  },
  decorators: [(Story) => h("div.story-frame", h(Story))],
  parameters: {
    docs: {
      story: { inline: false, iframeHeight: 800 },
    },
  },
};

export default meta;

type Story = StoryObj<SharedScaleTimescalesProps>;

/** Western Interior ammonite zones through the Campanian, against the
 * international epochs and ages they are calibrated to. */
export const Primary: Story = {
  args: {
    timescales: [
      INTERNATIONAL_AGES,
      {
        timescaleID: 19,
        label: "Ammonite zones (Western Interior)",
        wideLabels: true,
      },
    ],
    ageRange: [84, 72],
    length: 1000,
  },
};

/** The same pattern at the Cambrian–Ordovician boundary, where the Laurentian
 * trilobite zones are finer than the international ages by a wide margin. */
export const TrilobiteZones: Story = {
  args: {
    timescales: [
      INTERNATIONAL_AGES,
      {
        timescaleID: 15,
        label: "Trilobite zones (Laurentia)",
        wideLabels: true,
      },
    ],
    ageRange: [497, 485],
    length: 1000,
  },
};

/** Three timescales on one scale, across the Eocene–Oligocene boundary: the
 * international ages and two independent microfossil zonations. Nothing about
 * the arrangement is specific to two columns. */
export const ThreeTimescales: Story = {
  args: {
    timescales: [
      INTERNATIONAL_AGES,
      {
        timescaleID: 5,
        label: "Calcareous nannoplankton zones",
        wideLabels: true,
        size: "7em",
      },
      {
        timescaleID: 24,
        label: "Planktic foraminifer primary biozones",
        wideLabels: true,
        size: "15em",
      },
    ],
    ageRange: [40, 30],
    length: 900,
  },
};

/* --------------------------------------------------------------------------
 * Equidistant surfaces
 * ------------------------------------------------------------------------ */

interface EquidistantSurfacesProps {
  timescales?: TimescaleSpec[];
  ageRange?: [number, number];
  /** Pixel height given to each interval between successive surfaces */
  spacing?: number;
}

interface Surface {
  age: number;
  /** Present in every timescale, rather than in only some of them */
  shared: boolean;
}

/** Timescales laid out so that every boundary in any of them gets the same
 * pixel spacing, rather than its true duration.
 *
 * This is the non-absolute counterpart to `SharedScaleTimescales`: it keeps
 * boundaries meeting exactly across the columns, which a flex layout can't do,
 * without letting a short interval collapse to a few pixels. The trick is that
 * a `d3` linear scale is happy to be piecewise — the domain is every distinct
 * boundary age in either timescale, and the range steps by `spacing` for each
 * one — so both timescales can be handed the same scale and drawn the way they
 * always are. An age axis would be meaningless here, so the surfaces carry
 * their own ages instead.
 */
function EquidistantSurfaceTimescales(props: EquidistantSurfacesProps) {
  const {
    timescales = DEFAULT_MISALIGNED_PAIR,
    ageRange = DEFAULT_MISALIGNED_RANGE,
    spacing = 44,
  } = props;
  const intervals = useMacrostratTimescales(timescaleIDs(timescales));

  const { scale, surfaces } = useMemo(
    () =>
      equidistantScale(
        timescales.map((spec) => ({
          intervals: intervals.get(spec.timescaleID) ?? [],
          levels: spec.levels,
        })),
        ageRange,
        spacing,
      ),
    [intervals, timescales, ageRange[0], ageRange[1], spacing],
  );

  if (scale == null) return null;

  return h("div.equidistant", [
    h(
      "div.columns",
      timescales.map((spec) =>
        h(SharedScaleTimescaleColumn, {
          key: spec.timescaleID,
          spec,
          scale,
          intervals: intervals.get(spec.timescaleID) ?? [],
        }),
      ),
    ),
    h(
      "div.surface-overlay",
      surfaces.map((surface) =>
        h(
          "div.surface",
          {
            key: surface.age,
            className: classNames({ shared: surface.shared }),
            style: { top: scale(surface.age) },
          },
          h("span.surface-age", `${surface.age} Ma`),
        ),
      ),
    ),
  ]);
}

/** Every distinct boundary age in any of the timescales, and a scale that
 * gives each successive pair of them the same pixel height. */
function equidistantScale(
  sets: { intervals: Interval[]; levels?: [number, number] }[],
  ageRange: [number, number],
  spacing: number,
) {
  const younger = Math.min(...ageRange);
  const older = Math.max(...ageRange);

  const perTimescale = sets.map(({ intervals, levels }) =>
    boundaryAges(intervals, levels, younger, older),
  );

  const all = new Set<number>();
  for (const ages of perTimescale) {
    for (const age of ages) all.add(age);
  }

  const ages = Array.from(all).sort((a, b) => a - b);
  if (ages.length < 2) {
    return { scale: null, surfaces: [] as Surface[] };
  }

  // Intervals stack youngest-first from the top of the column, so the
  // youngest surface is at y = 0 and each older one is `spacing` px further
  // down. (Direction is immaterial to `Timescale`, which only ever takes
  // differences of the scale, but the overlay positions from it directly.)
  const range = ages.map((_, i) => i * spacing);

  const surfaces = ages.map((age) => ({
    age,
    shared: perTimescale.every((d) => d.has(age)),
  }));

  return { scale: scaleLinear({ domain: ages, range }), surfaces };
}

function boundaryAges(
  intervals: Interval[],
  levels: [number, number] = [1, 1],
  younger: number,
  older: number,
): Set<number> {
  const [minLevel, maxLevel] = levels;
  const ages = new Set<number>();
  for (const interval of intervals) {
    if (interval.lvl < minLevel || interval.lvl > maxLevel) continue;
    for (const age of [interval.eag, interval.lag]) {
      if (age < younger || age > older) continue;
      // Boundaries shared between timescales are recorded to the same
      // precision, but round anyway so a float tail can't split one surface
      // into two lines a pixel apart.
      ages.add(Math.round(age * 1000) / 1000);
    }
  }
  return ages;
}

/** The Carboniferous, where the North American regional stages were defined
 * on their own sections and agree with the international ages at only four
 * boundaries out of fourteen. */
const DEFAULT_MISALIGNED_PAIR: TimescaleSpec[] = [
  {
    timescaleID: 11,
    label: "International ages",
    levels: [5, 5],
    wideLabels: true,
    size: "9em",
  },
  {
    timescaleID: 17,
    label: "North American regional stages",
    wideLabels: true,
    size: "10em",
  },
];

const DEFAULT_MISALIGNED_RANGE: [number, number] = [358.86, 298.9];

/** Two zonations that disagree about where the boundaries fall, on a scale
 * built from the boundaries themselves. */
export const EquidistantSurfaces: StoryObj<EquidistantSurfacesProps> = {
  render: (args) => h(EquidistantSurfaceTimescales, args),
  args: {
    timescales: DEFAULT_MISALIGNED_PAIR,
    ageRange: DEFAULT_MISALIGNED_RANGE,
    spacing: 44,
  },
};
