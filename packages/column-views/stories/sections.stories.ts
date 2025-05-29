import { Meta, StoryObj } from "@storybook/react";

import { ColoredUnitComponent } from "@macrostrat/column-views";
import "@macrostrat/style-system";
import { ColumnAxisType } from "@macrostrat/column-components";
import { StandaloneColumn, StandaloneColumnProps } from "./column-ui";

type Story = StoryObj<typeof StandaloneColumn>;

const meta: Meta<StandaloneColumnProps> = {
  title: "Column views/Stratigraphic sections",
  component: StandaloneColumn,
  args: {
    id: 432,
    unconformityLabels: true,
    showLabelColumn: true,
    columnWidth: 200,
    width: 400,
    unitComponent: ColoredUnitComponent,
    showUnitPopover: true,
    keyboardNavigation: true,
    axisType: ColumnAxisType.DEPTH,
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

export const eODPColumn: Story = {
  args: {
    id: 5576,
    inProcess: true,
  },
};

export const eODPColumnV2: Story = {
  args: {
    id: 5248,
    inProcess: true,
  },
};

export const OrdinalPosition: Story = {
  args: {
    id: 432,
    axisType: ColumnAxisType.ORDINAL,
    unitComponentProps: {
      nColumns: 5,
    },
  },
};
