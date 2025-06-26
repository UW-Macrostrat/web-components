import {
  ColoredUnitComponent,
  MacrostratDataProvider,
  MergeSectionsMode,
  PBDBFossilsColumn,
} from "../../src";
import h from "@macrostrat/hyper";
import { StandaloneColumn } from "../column-ui";
import { Meta } from "@storybook/react-vite";
import { ColumnAxisType } from "@macrostrat/column-components";

function PBDBFossilsDemoColumn(props) {
  const { id, children, spectraColor, ...rest } = props;

  return h(
    MacrostratDataProvider,
    h(
      StandaloneColumn,
      {
        id,
        showTimescale: false,
        showLabelColumn: false,
        allowUnitSelection: false,
        ...rest,
      },
      h(PBDBFossilsColumn, { columnID: id, color: spectraColor }),
    ),
  );
}

export default {
  title: "Column views/Facets/Fossil occurrences",
  component: PBDBFossilsDemoColumn,
  tags: ["!autodocs"],
  argTypes: {
    axisType: {
      options: ["age", "depth"],
      control: { type: "radio" },
    },
  },
} as Meta;

export const eODPColumn: Story = {
  args: {
    id: 5576,
    inProcess: true,
    axisType: ColumnAxisType.DEPTH,
    pixelScale: 5,
    allowUnitSelection: true,
    showUnitPopover: true,
    collapseSmallUnconformities: true,
    keyboardNavigation: true,
  },
};

export const eODPColumnMoreComplete: Story = {
  args: {
    id: 5278,
    inProcess: true,
    axisType: ColumnAxisType.DEPTH,
    pixelScale: 5,
    allowUnitSelection: true,
    showUnitPopover: true,
    collapseSmallUnconformities: true,
    keyboardNavigation: true,
  },
  title: "eODP Column (more complete)",
};

export const eODPColumnAgeFramework: Story = {
  args: {
    id: 5576,
    inProcess: true,
    collapseSmallUnconformities: false,
    mergeSections: MergeSectionsMode.OVERLAPPING,
  },
  title: "eODP Column (with age model applied)",
};

export const ParadoxBasin = {
  args: {
    id: 495,
  },
};

export const UintaBasin = {
  args: {
    id: 502,
  },
};

export const BighornBasinColored = {
  args: {
    id: 515,
    showTimescale: true,
    allowUnitSelection: true,
    unitComponent: ColoredUnitComponent,
    spectraColor: "lightgreen",
    showUnitPopover: true,
    collapseSmallUnconformities: true,
    keyboardNavigation: true,
  },
};
