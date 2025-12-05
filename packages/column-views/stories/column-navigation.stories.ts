import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react-vite";
import "@macrostrat/style-system";
import { ColumnStoryUI } from "./column-ui";
import { MinimalUnit } from "../src/units/boxes";
import {
  BoundaryAgeModelOverlay,
  ComputedSurfacesOverlay,
  EnvironmentColoredUnitComponent,
} from "../src";
import { useColumnSelection } from "./column-ui/utils";
import { sharedColumnArgTypes } from "./arg-types";

export default {
  title: "Column views/Column navigation",
  component: ColumnStoryUI,
  args: {
    columnID: 432,
    axisType: "age",
    collapseSmallUnconformities: false,
    targetUnitHeight: 20,
  },
  argTypes: {
    ...sharedColumnArgTypes,
  },
} as Meta<typeof ColumnStoryUI>;

function Template(args) {
  return h(ColumnStoryUI, {
    ...args,
    ...useColumnSelection(),
  });
}

export const Primary = Template.bind({});

export const ColoredByEnvironment = Template.bind({});
ColoredByEnvironment.args = {
  columnID: 432,
  axisType: "age",
  unitComponent: EnvironmentColoredUnitComponent,
};

export const Minimal = Template.bind({});
Minimal.args = {
  mergeSections: "all",
  axisType: "age",
  showLabels: false,
  pixelScale: 0.4,
  unitComponent: MinimalUnit,
  showTimescale: true,
  timescaleLevels: [1, 2],
};

export const eODP = Template.bind({});
eODP.args = {
  columnID: 5576,
  axisType: "depth",
  projectID: 3,
  pixelScale: undefined,
  maxInternalColumns: 1,
};

export const withBoundaryAgeModel = Template.bind({});
withBoundaryAgeModel.args = {
  columnID: 432,
  axisType: "age",
  children: h(BoundaryAgeModelOverlay),
};

export const withComputedSurfaces = Template.bind({});
withComputedSurfaces.args = {
  columnID: 432,
  axisType: "age",
  children: h(ComputedSurfacesOverlay),
};
