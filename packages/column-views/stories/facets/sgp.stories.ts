import {
  ColoredUnitComponent,
  MacrostratDataProvider,
  SGPMeasurementsColumn,
} from "../../src";
import h from "@macrostrat/hyper";
import { StandaloneColumn } from "../column-ui";
import { Meta } from "@storybook/react-vite";
import { ColumnAxisType } from "@macrostrat/column-components";

function SGPMeasurementsDemoColumn(props) {
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
      h(SGPMeasurementsColumn, { columnID: id, color: spectraColor }),
    ),
  );
}

export default {
  title: "Column views/Facets/SGP Samples",
  component: SGPMeasurementsDemoColumn,
  tags: ["!autodocs"],
  argTypes: {
    axisType: {
      options: ["age", "depth"],
      control: { type: "radio" },
    },
  },
} as Meta;

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
