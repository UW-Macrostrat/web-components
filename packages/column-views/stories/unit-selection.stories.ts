import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta, StoryObj } from "@storybook/react-vite";
import { FlexRow, JSONView } from "@macrostrat/ui-components";

import "@macrostrat/style-system";
import { useState } from "react";
import { AgeCursor, AgeLabel, ColoredUnitComponent } from "../src";

import { StandaloneColumn, StandaloneColumnProps } from "./column-ui";

const h = hyper.styled(styles);

function UnitSelectionRenderer(props) {
  const { nColumns, ...rest } = props;
  return h(StandaloneColumn, {
    id: 483,
    showLabelColumn: false,
    width: 450,
    columnWidth: 200,
    unitComponent: ColoredUnitComponent,
    unitComponentProps: {
      nColumns,
    },
    showUnitPopover: false,
    keyboardNavigation: true,
    onUnitSelected(unit) {
      console.log(unit);
    },
    ...props,
  });
}

type Story = StoryObj<typeof StandaloneColumn>;

const meta: Meta<StandaloneColumnProps> = {
  title: "Column views/Unit selection",
  component: UnitSelectionRenderer,
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
    showLabelColumn: true,
    t_age: 375,
    b_age: 390,
    pixelScale: 20,
  },
};

export const WithUnitPopover: Story = {
  args: {
    id: 432,
    showLabelColumn: true,
    t_age: 375,
    b_age: 390,
    pixelScale: 20,
    showUnitPopover: true,
  },
};
