import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta } from "@storybook/react";
import "@macrostrat/style-system";
import { ColumnUI } from "./column-ui";
import { useArgs } from "@storybook/client-api";

const h = hyper.styled(styles);

export default {
  title: "Column views/Column navigation",
  component: ColumnUI,
  args: {
    columnID: 432,
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
  },
} as Meta<ColumnUI>;

export function ColumnSelector() {
  const [{ columnID, selectedUnit }, updateArgs] = useArgs();
  const setColumn = (columnID) => {
    updateArgs({ columnID, selectedUnit: undefined });
  };

  const setSelectedUnit = (selectedUnit) => {
    updateArgs({ selectedUnit });
  };

  return h(ColumnUI, { columnID, setColumn, selectedUnit, setSelectedUnit });
}
