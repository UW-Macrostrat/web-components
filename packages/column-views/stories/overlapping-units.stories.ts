import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta, StoryObj } from "@storybook/react-vite";
import { FlexRow, JSONView } from "@macrostrat/ui-components";

import "@macrostrat/style-system";
import { useState } from "react";
import {
  AgeCursor,
  AgeLabel,
  ColoredUnitComponent,
  MergeSectionsMode,
} from "../src";

import { StandaloneColumn, StandaloneColumnProps } from "./column-ui";

const h = hyper.styled(styles);

function OverlappingUnitsRenderer(props) {
  const { nColumns = 5, ...rest } = props;
  return h(StandaloneColumn, {
    id: 483,
    showLabelColumn: true,
    width: 450,
    columnWidth: 200,
    unitComponent: ColoredUnitComponent,
    unitComponentProps: {
      nColumns,
    },
    showUnitPopover: true,
    keyboardNavigation: true,
    mergeSections: MergeSectionsMode.OVERLAPPING,
    onUnitSelected(unit) {
      console.log(unit);
    },
    ...rest,
  });
}

type Story = StoryObj<typeof StandaloneColumn>;

const meta: Meta<StandaloneColumnProps> = {
  title: "Column views/Overlapping units",
  component: OverlappingUnitsRenderer,
  args: {},
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

export const Primary: Story = {
  args: {
    id: 432,
    t_age: 375,
    b_age: 390,
    pixelScale: 20,
  },
};

export const ComplexOverlaps: Story = {
  args: {
    id: 432,
    t_age: 0,
    b_age: 1.2,
    pixelScale: 150,
  },
};

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export

export const FilteredToAgeRange: Story = {
  args: {
    id: 510,
    t_age: 0,
    b_age: 66,
    pixelScale: 10,
  },
};

export const FossilBasin: Story = {
  args: {
    id: 507,
    t_age: 100,
    b_age: 135,
    pixelScale: 10,
    maxInternalUnits: 5,
  },
};
