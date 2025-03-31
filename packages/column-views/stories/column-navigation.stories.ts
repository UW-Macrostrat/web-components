import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta } from "@storybook/react";
import "@macrostrat/style-system";
import { ColumnStoryUI } from "./column-ui";
import { useArgs } from "@storybook/client-api";
import { ColumnAxisType } from "@macrostrat/column-components";

const h = hyper.styled(styles);

export default {
  title: "Column views/Column navigation",
  component: ColumnStoryUI,
  args: {
    columnID: 432,
    selectedUnit: undefined,
    axisType: ColumnAxisType.AGE,
  },
  argTypes: {
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
    axisType: {
      options: ["age", "ordinal"],
      control: { type: "radio" },
    },
  },
} as Meta<ColumnStoryUI>;

export function ColumnSelector() {
  const [{ columnID, selectedUnit, axisType }, updateArgs] = useArgs();
  const setColumn = (columnID) => {
    updateArgs({ columnID, selectedUnit: undefined });
  };

  const setSelectedUnit = (selectedUnit) => {
    updateArgs({ selectedUnit });
  };

  return h(ColumnStoryUI, {
    columnID,
    setColumn,
    selectedUnit,
    setSelectedUnit,
    axisType,
  });
}
