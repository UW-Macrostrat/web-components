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
import { Meta, StoryObj } from "@storybook/react-vite";
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

const meta = {
  title: "Column views/Facets/Fossils (via PBDB)",
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
} satisfies Meta<typeof PBDBFossilsDemoColumn>;

export default meta;

type Story = StoryObj<typeof meta>;

export const eODPColumnCollections = {
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

export const eODPColumnTaxa = {
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
  name: "eODP Column (more complete)",
};

export const eODPColumnAgeFramework: Story = {
  args: {
    id: 5576,
    inProcess: true,
    collapseSmallUnconformities: false,
    mergeSections: MergeSectionsMode.OVERLAPPING,
    axisType: "age",
  },
  name: "eODP Column (with age model applied)",
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
