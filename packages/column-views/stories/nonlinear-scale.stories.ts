import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta, StoryObj } from "@storybook/react-vite";

import {
  ApproximateHeightAxis,
  ColoredUnitComponent,
  ComputedSurfacesOverlay,
  MergeSectionsMode,
} from "@macrostrat/column-views";
import "@macrostrat/style-system";

import { StandaloneColumn, StandaloneColumnProps } from "./column-ui";
import { MinimalUnit } from "../src/units/boxes";
import { scaleLinear, scaleLog, scalePow } from "d3-scale";
import { ColumnAxisType } from "@macrostrat/column-components";
import { HybridScaleType } from "../src/prepare-units";

const h = hyper.styled(styles);

type Story = StoryObj<typeof StandaloneColumn>;

const meta: Meta<StandaloneColumnProps> = {
  title: "Column views/Nonlinear scale",
  component: StandaloneColumn,
  args: {
    id: 432,
    unconformityLabels: true,
    showLabels: true,
  },
  parameters: {
    docs: {
      story: {
        inline: false,
        iframeHeight: 700,
      },
    },
  },
};

export default meta;

export const LinearScale: Story = {
  args: {
    id: 432,
    mergeSections: MergeSectionsMode.ALL,
    axisType: ColumnAxisType.AGE,
    showLabels: false,
    unitComponent: MinimalUnit,
    showTimescale: true,
    timescaleLevels: [1, 2],
    // NOTE: scale domains are clipped to the age range of the column
    scale: scaleLinear().domain([0, 4000]).range([0, 1500]),
  },
};

// Logarithmic age scale

const logScale = scaleLog().base(10).domain([0.001, 4000]).range([0, 1000]);

export const LogScale: Story = {
  args: {
    id: 432,
    mergeSections: MergeSectionsMode.ALL,
    axisType: ColumnAxisType.AGE,
    showLabels: false,
    unitComponent: MinimalUnit,
    showTimescale: true,
    timescaleLevels: [1, 2],
    scale: logScale,
    t_age: 0.01,
  },
};

const powScale = scalePow().exponent(0.5).domain([0, 4500]).range([0, 600]);

export const PowerScale: Story = {
  args: {
    id: 432,
    mergeSections: MergeSectionsMode.ALL,
    axisType: ColumnAxisType.AGE,
    showLabels: false,
    unitComponent: MinimalUnit,
    showUnitPopover: true,
    showTimescale: true,
    timescaleLevels: [1, 2],
    scale: powScale,
    t_age: 0,
  },
};

export const EquidistantSurfaces: Story = {
  args: {
    id: 432,
    // Ordered time bins
    axisType: ColumnAxisType.AGE,
    hybridScale: {
      type: HybridScaleType.EquidistantSurfaces,
    },
    showLabels: false,
    unitComponent: ColoredUnitComponent,
    showTimescale: true,
    timescaleLevels: [1, 3],
    showUnitPopover: true,
    pixelScale: 30,
  },
};

export const HeightScale: Story = {
  args: {
    id: 448,
    // Ordered time bins
    axisType: ColumnAxisType.AGE,
    hybridScale: {
      type: HybridScaleType.ApproximateHeight,
    },
    showLabels: false,
    unitComponent: ColoredUnitComponent,
    showTimescale: true,
    timescaleLevels: [1, 3],
    showUnitPopover: true,
    children: h(ComputedSurfacesOverlay),
  },
};

export const KentuckyOrdovician: Story = {
  args: {
    id: 448,
    // Ordered time bins
    axisType: ColumnAxisType.AGE,
    hybridScale: {
      type: HybridScaleType.ApproximateHeight,
    },
    showLabels: false,
    unitComponent: ColoredUnitComponent,
    showTimescale: true,
    t_age: 455,
    b_age: 490,
    timescaleLevels: [1, 3],
    showUnitPopover: true,
  },
};

export const WithApproximateHeightScale: Story = {
  args: {
    id: 448,
    // Ordered time bins
    axisType: ColumnAxisType.AGE,
    hybridScale: {
      type: HybridScaleType.ApproximateHeight,
    },
    showLabels: false,
    unitComponent: ColoredUnitComponent,
    showTimescale: true,
    t_age: 455,
    b_age: 490,
    timescaleLevels: [1, 3],
    showUnitPopover: true,
    children: h(ApproximateHeightAxis, {
      // Move to the left side
      style: { order: -1, marginRight: "8px" },
    }),
  },
};

export const WithApproximateHeightScaleOnly: Story = {
  args: {
    id: 448,
    // Ordered time bins
    pixelScale: 0.5,
    axisType: ColumnAxisType.HEIGHT,
    hybridScale: {
      type: HybridScaleType.ApproximateHeight,
    },
    showLabels: false,
    unitComponent: ColoredUnitComponent,
    showUnitPopover: true,
    showTimescale: false,
    unconformityHeight: 20,
    unconformityLabels: false,
  },
};
