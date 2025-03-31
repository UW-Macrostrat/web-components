import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta } from "@storybook/react";
import "@macrostrat/style-system";
import { ColumnStoryUI } from "./column-ui";
import { useArgs } from "@storybook/client-api";
import { MinimalUnit } from "../src/units/boxes";

const h = hyper.styled(styles);

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
  },
} as Meta<ColumnStoryUI>;

function useColumnSelection() {
  const [{ columnID, selectedUnit }, updateArgs] = useArgs();
  const setColumn = (columnID) => {
    console.log("setColumn", columnID);
    updateArgs({ columnID });
  };

  const setSelectedUnit = (selectedUnit) => {
    console.log("setSelectedUnit", selectedUnit);
    updateArgs({ selectedUnit });
  };

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
