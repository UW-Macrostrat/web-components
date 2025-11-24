import {
  ColoredUnitComponent,
  MacrostratDataProvider,
  MergeSectionsMode,
  PBDBFossilsColumn,
  PBDBOccurrencesMatrix,
  FossilDataType,
} from "../../src";
import h from "@macrostrat/hyper";
import { StandaloneColumn } from "../column-ui";
import { Meta } from "@storybook/react-vite";
import { ColumnAxisType } from "@macrostrat/column-components";

function PBDBFossilsDemoColumn(props) {
  const { id, children, type = FossilDataType.Collections, ...rest } = props;

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
      h(PBDBFossilsColumn, { columnID: id, type }),
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
    type: {
      options: Object.values(FossilDataType),
      control: { type: "select" },
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
    type: FossilDataType.Collections,
  },
};

export const eODPColumnOccurrences: Story = {
  args: {
    id: 5576,
    axisType: ColumnAxisType.DEPTH,
    pixelScale: 20,
    allowUnitSelection: true,
    showUnitPopover: true,
    collapseSmallUnconformities: true,
    keyboardNavigation: true,
    type: FossilDataType.Occurrences,
  },
};

export function eODPColumnWithTaxonRanges() {
  const id = 5576;
  return h(
    MacrostratDataProvider,
    h(
      StandaloneColumn,
      {
        showTimescale: false,
        showLabelColumn: false,
        allowUnitSelection: false,
        id,
        axisType: ColumnAxisType.DEPTH,
        pixelScale: 20,
        paddingTop: 200,
        allowUnitSelection: true,
        showUnitPopover: true,
        collapseSmallUnconformities: true,
        keyboardNavigation: true,
      },
      h(PBDBOccurrencesMatrix, { columnID: id }),
    ),
  );
}

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
    axisType: "age",
  },
  title: "eODP Column (with age model applied)",
};

export const ParadoxBasin = {
  args: {
    id: 495,
    type: "colls",
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
