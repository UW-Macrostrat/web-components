import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta } from "@storybook/react";
import "@macrostrat/style-system";
import { ColumnStoryUI } from "./column-ui";
import { useArgs } from "@storybook/client-api";
import { ColumnAxisType } from "@macrostrat/column-components";
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
    selectedUnit: undefined,
    axisType: ColumnAxisType.AGE,
  },
  argTypes: {
    ...baseArgTypes,
    axisType: {
      options: ["age", "ordinal"],
      control: { type: "radio" },
    },
  },
} as Meta<ColumnStoryUI>;

export function ColumnSelector() {
  const [
    { columnID, selectedUnit, axisType, minimal, t_age, b_age },
    updateArgs,
  ] = useArgs();
  const setColumn = (columnID) => {
    updateArgs({ columnID, selectedUnit: undefined });
  };

  const setSelectedUnit = (selectedUnit) => {
    updateArgs({ selectedUnit });
  };

  let minimalArgs = {};
  if (minimal) {
    minimalArgs = {
      mergeSections: "all",
      showLabels: false,
      pixelScale: 1.2,
      //t_age: 0,
      //b_age: 650,
      unitComponent: MinimalUnit,
    };
  }

  return h(ColumnStoryUI, {
    columnID,
    setColumn,
    selectedUnit,
    setSelectedUnit,
    axisType,
    ...minimalArgs,
  });
}
