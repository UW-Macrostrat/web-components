import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta, StoryObj } from "@storybook/react-vite";

import { MergeSectionsMode } from "@macrostrat/column-views";
import "@macrostrat/style-system";

import { StandaloneColumn, StandaloneColumnProps } from "./column-ui";
import { MinimalUnit } from "../src/units/boxes";
import { scaleLog, scalePow } from "d3-scale";
import { ColumnAxisType } from "@macrostrat/column-components";

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

// Logarithmic age scale

const logScale = scaleLog().base(10).domain([0.001, 4500]).range([0, 1000]);

const powScale = scalePow().exponent(0.5).domain([0, 4500]).range([0, 1500]);

export const Primary: Story = {
  args: {
    id: 432,
    mergeSections: MergeSectionsMode.ALL,
    axisType: ColumnAxisType.AGE,
    showLabels: false,
    unitComponent: MinimalUnit,
    showTimescale: true,
    timescaleLevels: [1, 2],
    scale: powScale,
    t_age: 0,
  },
};
