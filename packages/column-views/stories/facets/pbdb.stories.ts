import {
  ColoredUnitComponent,
  MacrostratDataProvider,
  MergeSectionsMode,
  PBDBFossilsColumn,
} from "../../src";
import h from "@macrostrat/hyper";
import { StandaloneColumn } from "../column-ui";
import { Meta } from "@storybook/react";
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
      h(PBDBFossilsColumn, { columnID: id, color: spectraColor })
    )
  );
}

export default {
  title: "Column views/Facets/Fossil occurrences",
  component: PBDBFossilsDemoColumn,
  autodocs: false,
} as Meta;

export const eODPColumn: Story = {
  args: {
    id: 5576,
    inProcess: true,
    axisType: ColumnAxisType.DEPTH,
  },
};

export const eODPColumnAgeFramework: Story = {
  args: {
    id: 5576,
    inProcess: true,
    collapseSmallUnconformities: false,
    mergeSections: MergeSectionsMode.OVERLAPPING,
  },
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
  },
};
