/** How tall a column draws, and what decides it.
 *
 * Every option here resolves to one quantity — density, the pixels given to a
 * Myr (or a metre) — so the controls are ways of naming the same thing. The
 * readout says what they worked out to, which is the point of the story:
 * sizing is easy to reason about in the abstract and hard to predict across
 * real age ranges, where sections differ in how finely they're divided.
 *
 * Clicking a timescale interval sets the rendered window to it and writes
 * that back to the `t_age`/`b_age` controls, so the window can be steered
 * either way; shift-click widens to include another interval, and a click on
 * empty timescale clears the window. */
import hyper from "@macrostrat/hyper";
import { useCallback, useMemo } from "react";
import { Spinner } from "@blueprintjs/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { ColumnAxisType } from "@macrostrat/column-components";
import type { Interval } from "@macrostrat/timescale";
import type { UnitLong } from "@macrostrat/api-types";
import "@macrostrat/style-system";

import {
  ColoredUnitComponent,
  Column,
  getUnitHeightRange,
  statedDensity,
  HeightMethod,
  HybridScaleType,
  usePreparedColumnUnits,
  type SectionOptionsLike,
} from "../src";
import { useColumnBasicInfo, useColumnUnits } from "./column-ui/utils";
import h from "./column-axis-sizing.stories.module.sass";

interface AxisSizingProps {
  columnID: number;
  inProcess: boolean;
  axisType?: ColumnAxisType;
  t_age?: number | null;
  b_age?: number | null;
  targetUnitHeight?: number;
  /** Densities stated outright, which take over from `targetUnitHeight`.
   * Zero means "not set" — a number control can't hold `undefined`, and
   * without a way back the other controls would stop doing anything. */
  pixelsPerMyr?: number;
  pixelsPerMeter?: number;
  /** Pixels between surfaces, for the equidistant scale */
  pixelScale?: number;
  minSectionHeight?: number;
  minPixelScale?: number;
  /** Suppress the label for a unit drawn thinner than this */
  labelSuppressHeight?: number;
  /** A scale that isn't a density at all: surfaces spaced evenly, or units
   * placed by their measured thickness */
  hybridScale?: "none" | HybridScaleType;
  /** Which thickness to believe, for the height scale */
  heightMethod?: HeightMethod;
  /** Metres given to an interval whose units are thinner than this */
  minHeight?: number;
  /** Metres given to an interval with no thickness on record */
  defaultHeight?: number;
  unconformityHeight?: number;
  collapseSmallUnconformities?: boolean;
  windowPadding?: number;
  timescaleLevels?: [number, number];
  /** Sizing decided per section, rather than for the column as a whole */
  sectionOptions?: SectionOptionsLike;
  /** Set the rendered window, which is held in the story's own args */
  setWindow?(window: { t_age: number | null; b_age: number | null }): void;
}

/** Storybook's preview hooks only work in the story's own render, so the
 * window is set there and handed down. */
function useWindowControls() {
  const [, updateArgs] = useArgs();
  const setWindow = useCallback(
    (window: { t_age: number | null; b_age: number | null }) =>
      updateArgs(window),
    [updateArgs],
  );
  return { setWindow };
}

function AxisSizingColumn(props: AxisSizingProps) {
  const {
    columnID,
    axisType = ColumnAxisType.AGE,
    inProcess,
    t_age,
    b_age,
    targetUnitHeight = 20,
    pixelsPerMyr = 0,
    pixelsPerMeter = 0,
    pixelScale = 0,
    minSectionHeight = 50,
    minPixelScale = 0.2,
    labelSuppressHeight = 2,
    hybridScale = "none",
    heightMethod = HeightMethod.Maximum,
    minHeight = 5,
    defaultHeight = 100,
    unconformityHeight = 30,
    collapseSmallUnconformities = true,
    windowPadding = 0,
    timescaleLevels = [2, 5],
    sectionOptions,
    setWindow,
  } = props;

  const units = useColumnUnits(columnID, inProcess) as any as UnitLong[] | null;
  const info = useColumnBasicInfo(columnID, inProcess);

  // 0 is how this story spells "leave it to the units". Both densities are
  // held at once: the axis picks, so toggling it keeps each meaningful.
  const off = (value: number) => (value > 0 ? value : undefined);

  /** A hybrid scale replaces the density rules outright: the column is laid
   * out from surfaces or from measured thickness, and `pixelScale` changes
   * meaning — pixels per surface, or pixels per metre. */
  let hybrid: any = undefined;
  if (hybridScale === HybridScaleType.EquidistantSurfaces) {
    hybrid = { type: HybridScaleType.EquidistantSurfaces };
  }
  if (hybridScale === HybridScaleType.ApproximateHeight) {
    hybrid = {
      type: HybridScaleType.ApproximateHeight,
      heightMethod,
      minHeight,
      defaultHeight,
    };
  }

  const sizing = useMemo(
    () => ({
      axisType,
      t_age,
      b_age,
      targetUnitHeight,
      pixelsPerMyr: off(pixelsPerMyr),
      pixelsPerMeter: off(pixelsPerMeter),
      pixelScale: off(pixelScale),
      minPixelScale,
      minSectionHeight,
      sectionOptions,
      hybridScale: hybrid,
      unconformityHeight,
      collapseSmallUnconformities,
      windowPadding,
    }),
    [
      axisType,
      t_age,
      b_age,
      targetUnitHeight,
      pixelsPerMyr,
      pixelsPerMeter,
      pixelScale,
      minPixelScale,
      minSectionHeight,
      sectionOptions,
      hybridScale,
      heightMethod,
      minHeight,
      defaultHeight,
      unconformityHeight,
      collapseSmallUnconformities,
      windowPadding,
    ],
  );

  /** The window follows the timescale, and the controls follow the window. */
  const onClickTimescaleInterval = useCallback(
    (event: Event, data: { interval?: Interval }) => {
      const interval = data?.interval;
      if (setWindow == null) return;
      if (interval == null) {
        setWindow({ t_age: null, b_age: null });
        return;
      }
      if ((event as MouseEvent)?.shiftKey && t_age != null && b_age != null) {
        setWindow({
          t_age: Math.min(t_age, interval.lag),
          b_age: Math.max(b_age, interval.eag),
        });
        return;
      }
      setWindow({ t_age: interval.lag, b_age: interval.eag });
    },
    [setWindow, t_age, b_age],
  );

  if (units == null) return h(Spinner);

  return h("div.axis-sizing", [
    h("h2", info?.col_name ?? `Column ${columnID}`),
    h(SizingReadout, { units, options: sizing }),
    h(
      "p.hint",
      "Click a timescale interval to render that window; shift-click another to widen to it; click empty timescale to clear.",
    ),
    h(Column, {
      units,
      unitComponent: ColoredUnitComponent,
      labelSuppressHeight,
      showTimescale: true,
      timescaleLevels,
      onClickTimescaleInterval,
      unconformityLabels: true,
      columnWidth: 200,
      width: 400,
      ...sizing,
    }),
  ]);
}

/** What the controls worked out to. The same preparation the column runs, so
 * these are the numbers it drew with rather than a measurement of the page. */
function SizingReadout({ units, options }) {
  const { sections, totalHeight } = usePreparedColumnUnits(units, options);

  // Measured through each section's scale rather than from a density: a
  // hybrid scale has no single density to multiply by.
  const unitHeights = useMemo(() => {
    const heights: number[] = [];
    for (const section of sections) {
      const { scale } = section.scaleInfo;
      if (scale == null) continue;
      for (const unit of section.units) {
        // Whatever the axis measures: metres down a core, Myr across time
        const [bottom, top] = getUnitHeightRange(unit, options.axisType);
        const height = Math.abs(scale(bottom) - scale(top));
        if (height > 0) heights.push(height);
      }
    }
    return heights.sort((a, b) => a - b);
  }, [sections, options.axisType]);

  const quantile = (q: number) => {
    if (unitHeights.length === 0) return 0;
    return unitHeights[Math.floor((unitHeights.length - 1) * q)];
  };

  // What each section worked out to on average, whatever set it
  const densities = sections
    .map((d) => {
      const { pixelHeight, domain } = d.scaleInfo;
      const extent = Math.abs(domain[1] - domain[0]);
      if (!(extent > 0)) return null;
      return pixelHeight / extent;
    })
    .filter((d) => d > 0);

  let rule = "from units";
  if (statedDensity(options, options.axisType) != null) rule = "stated density";
  if (options.hybridScale?.type === HybridScaleType.EquidistantSurfaces) {
    rule = "equidistant surfaces";
  }
  if (options.hybridScale?.type === HybridScaleType.ApproximateHeight) {
    rule = "approximate height";
  }

  return h("div.readout", [
    h(Measure, { label: "Sized", value: rule }),
    h(Measure, { label: "Column", value: `${Math.round(totalHeight)} px` }),
    h(Measure, { label: "Sections", value: sections.length }),
    h(Measure, { label: "Units drawn", value: unitHeights.length }),
    h(Measure, {
      label: "Unit height (p10 / median / p90)",
      value: [quantile(0.1), quantile(0.5), quantile(0.9)]
        .map((d) => d.toFixed(1))
        .join(" / "),
    }),
    h(Measure, {
      label: "Under 8 px",
      value: unitHeights.filter((d) => d < 8).length,
    }),
    h(Measure, {
      label: `Effective density (px/${axisUnit(options.axisType)})`,
      value: densityRange(densities),
    }),
  ]);
}

function Measure({ label, value }) {
  return h("div.measure", [
    h("span.measure-label", label),
    h("span.measure-value", String(value)),
  ]);
}

/** What one unit of the axis is */
function axisUnit(axisType: ColumnAxisType): string {
  if (axisType === ColumnAxisType.AGE) return "Myr";
  return "m";
}

function densityRange(densities: number[]): string {
  if (densities.length === 0) return "—";
  const min = Math.min(...densities);
  const max = Math.max(...densities);
  if (min === max) return min.toFixed(2);
  return `${min.toFixed(2)} – ${max.toFixed(2)}`;
}

const meta: Meta<AxisSizingProps> = {
  title: "Column views/Axis sizing",
  component: AxisSizingColumn,
  render: (args) => h(AxisSizingColumn, { ...args, ...useWindowControls() }),
  args: {
    columnID: 432,
    t_age: null,
    b_age: null,
    targetUnitHeight: 20,
    pixelsPerMyr: 0,
    pixelsPerMeter: 0,
    pixelScale: 0,
    minSectionHeight: 50,
    minPixelScale: 0.2,
    labelSuppressHeight: 2,
    hybridScale: "none",
    heightMethod: HeightMethod.Maximum,
    minHeight: 5,
    defaultHeight: 100,
    unconformityHeight: 30,
    collapseSmallUnconformities: true,
    windowPadding: 0,
  },
  argTypes: {
    columnID: { control: { type: "number" } },
    axisType: {
      options: [ColumnAxisType.AGE, ColumnAxisType.DEPTH],
      control: { type: "radio" },
    },
    t_age: { control: { type: "number" }, description: "Youngest age drawn" },
    b_age: { control: { type: "number" }, description: "Oldest age drawn" },
    targetUnitHeight: {
      control: { type: "range", min: 2, max: 240, step: 2 },
      description: "Pixels for a typical unit on screen",
    },
    pixelsPerMyr: {
      control: { type: "number", min: 0, step: 0.5 },
      description:
        "A density stated outright, for an age axis: it becomes the density, and targetUnitHeight and the floors stop applying. 0 turns it off, which is how a column is usually drawn.",
    },
    pixelsPerMeter: {
      control: { type: "number", min: 0, step: 0.5 },
      description:
        "The same, for a depth or height axis — and the scale for an approximate-height column, whose units are metres whatever its axis says. Held separately from px/Myr because the two differ by orders of magnitude; toggling the axis picks the right one.",
    },
    pixelScale: {
      control: { type: "number", min: 0, step: 0.5 },
      description:
        "The axis-agnostic spelling, for a view whose axis never changes. Also the spacing between surfaces on an equidistant scale.",
    },
    minSectionHeight: {
      control: { type: "number" },
      description: "Pixels a section gets however little it holds",
    },
    minPixelScale: {
      control: { type: "number" },
      description: "A floor on the density itself, in px/Myr",
    },
    hybridScale: {
      options: [
        "none",
        HybridScaleType.EquidistantSurfaces,
        HybridScaleType.ApproximateHeight,
      ],
      control: { type: "radio" },
      description:
        "A scale that isn't a density: surfaces spaced evenly, or units placed by measured thickness. Either replaces targetUnitHeight and the floors, and changes what pixelScale means (px per surface, px per metre).",
    },
    heightMethod: {
      options: [
        HeightMethod.Minimum,
        HeightMethod.Average,
        HeightMethod.Maximum,
      ],
      control: { type: "radio" },
      description: "Which recorded thickness the height scale believes",
    },
    minHeight: { control: { type: "number" } },
    defaultHeight: { control: { type: "number" } },
    labelSuppressHeight: {
      control: { type: "number" },
      description:
        "A unit drawn thinner than this gets no label. 0 labels everything, however thin.",
    },
    unconformityHeight: {
      control: { type: "range", min: 0, max: 120, step: 5 },
    },
    windowPadding: { control: { type: "range", min: 0, max: 300, step: 10 } },
    collapseSmallUnconformities: { control: { type: "boolean" } },
    timescaleLevels: { control: { type: "object" } },
    sectionOptions: { control: false },
  },
  parameters: {
    docs: { story: { inline: false, iframeHeight: 900 } },
  },
};

export default meta;

type Story = StoryObj<AxisSizingProps>;

/** A Paleozoic column with 111 units across fifteen sections: enough
 * variation in how finely sections are divided to show the rules apart. */
export const Primary: Story = {};

/** Drawn larger, by asking for more room per unit. The sections that gain
 * height are the ones with units to show for it; a section held up by
 * `minSectionHeight` stays where it is, since nothing about it needs the
 * room. */
export const Larger: Story = {
  args: { targetUnitHeight: 60 },
};

/** One density throughout, whatever a section contains. Thin units disappear
 * and thick ones dominate — what `targetUnitHeight` exists to avoid, and
 * still what you want when several columns must share a scale. */
export const FixedDensity: Story = {
  args: { pixelsPerMyr: 3 },
};

/** A narrow window, the case the sizing rules are hardest to predict for:
 * the units on screen should keep their height while the time they cover
 * shrinks. Click around the timescale to move it. */
export const NarrowWindow: Story = {
  args: { t_age: 323.4, b_age: 358.9, windowPadding: 60 },
};

/** Sizing decided section by section rather than for the column as a whole.
 * Here a section of only a few units is given a taller target, on the grounds
 * that there is room for it — the sort of rule that is easier to write than
 * to express as one number for the column. */
export const PerSectionSizing: Story = {
  args: {
    sectionOptions: (ctx) => {
      if (ctx.unitExtents.length <= 3) {
        return { targetUnitHeight: 60 };
      }
      if (ctx.unitExtents.length > 10) {
        return { targetUnitHeight: 12 };
      }
      return {};
    },
  },
};

/** Every surface the same distance from the next, whatever time separates
 * them: an ordinal scale in all but name. Duration stops being legible, and
 * thin units become as readable as thick ones. `pixelScale` is the spacing
 * between surfaces here, not a density. */
export const EquidistantSurfaces: Story = {
  args: {
    hybridScale: HybridScaleType.EquidistantSurfaces,
    pixelScale: 30,
  },
};

/** Units placed by the thickness recorded for them rather than by their
 * duration — a stratigraphic column rather than a time column, drawn on an
 * age axis. `pixelScale` is pixels per metre. Kentucky Ordovician (448),
 * which has thicknesses worth using. */
export const ApproximateHeight: Story = {
  args: {
    columnID: 448,
    hybridScale: HybridScaleType.ApproximateHeight,
    pixelsPerMeter: 0.5,
    t_age: 440,
    b_age: 490,
  },
};

/** A drill core on a depth axis, where "unit height" is metres rather than
 * Myr and the timescale plays no part. */
export const DepthAxis: Story = {
  args: {
    columnID: 5576,
    axisType: ColumnAxisType.DEPTH,
    t_age: null,
    b_age: null,
  },
};

/** Both stated densities held at once, on a column that can be drawn either
 * way. Toggle `axisType` and each stays meaningful — 3 px/Myr against 20
 * px/m, which is roughly the difference in magnitude between the two — where
 * a single `pixelScale` would carry an age-axis number onto a depth axis and
 * draw something absurd. */
export const EitherAxis: Story = {
  args: {
    columnID: 5576,
    axisType: ColumnAxisType.DEPTH,
    t_age: null,
    b_age: null,
    pixelsPerMyr: 3,
    pixelsPerMeter: 20,
  },
};
