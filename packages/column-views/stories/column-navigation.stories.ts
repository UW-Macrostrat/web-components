import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react";
import "@macrostrat/style-system";
import { ColumnStoryUI } from "./column-ui";
import { useArgs } from "@storybook/preview-api";
import { MinimalUnit } from "../src/units/boxes";
import { BoundaryAgeModelOverlay } from "../src";
import { useCallback } from "react";

const baseArgTypes = {
  columnID: {
    control: {
      type: "number",
    },
  },
  selectedUnit: {
    control: {
      type: "number",
    },
  },
  t_age: {
    control: {
      type: "number",
    },
  },
  b_age: {
    control: {
      type: "number",
    },
  },
};

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
    ...baseArgTypes,
    axisType: {
      options: ["age", "ordinal", "depth"],
      control: { type: "radio" },
    },
    mergeSections: {
      options: ["all", "overlapping", null],
      control: { type: "radio" },
    },
    pixelScale: {
      control: {
        type: "number",
      },
    },
    collapseSmallUnconformities: {
      control: {
        type: "boolean",
      },
    },
    minSectionHeight: {
      control: {
        type: "number",
      },
    },
    targetUnitHeight: {
      control: {
        type: "number",
      },
    },
    showLabelColumn: {
      control: {
        type: "boolean",
      },
    },
    maxInternalColumns: {
      control: {
        type: "number",
      },
    },
  },
} as Meta<ColumnStoryUI>;

function useColumnSelection() {
  const [{ columnID, selectedUnit }, updateArgs] = useArgs();
  const setColumn = (columnID) => {
    updateArgs({ columnID });
  };

  const setSelectedUnit = useCallback(
    (selectedUnit) => {
      updateArgs({ selectedUnit });
    },
    [updateArgs]
  );

  return {
    columnID,
    selectedUnit,
    setColumn,
    setSelectedUnit,
  };
}

function Template(args) {
  return h(ColumnStoryUI, {
    ...args,
    ...useColumnSelection(),
  });
}

export const Primary = Template.bind({});

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
  inProcess: true,
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
