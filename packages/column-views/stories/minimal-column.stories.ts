import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta } from "@storybook/react";
import "@macrostrat/style-system";
import { ColumnStoryUI } from "./column-ui";
import { useArgs } from "@storybook/client-api";
import { MinimalUnit } from "../src/units/boxes";

const h = hyper.styled(styles);

export default {
  title: "Column views/Minimal column",
  component: ColumnStoryUI,
  args: {
    columnID: 432,
    selectedUnit: undefined,
    pixelScale: 0.4,
    showTimescale: true,
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
    pixelScale: {
      control: {
        type: "number",
      },
    },
    showTimescale: {
      control: {
        type: "boolean",
      },
    },
  },
} as Meta<ColumnStoryUI>;

export function MinimalColumn() {
  const [
    {
      columnID,
      selectedUnit,
      t_age = 0,
      b_age = 4000,
      pixelScale,
      showTimescale,
    },
    updateArgs,
  ] = useArgs();
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
    t_age,
    b_age,
    mergeSections: "all",
    axisType: "age",
    showLabels: false,
    pixelScale,
    unitComponent: MinimalUnit,
    showTimescale,
  });
}
