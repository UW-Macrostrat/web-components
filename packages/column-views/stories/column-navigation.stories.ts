import hyper from "@macrostrat/hyper";
import styles from "./column.stories.module.sass";
import { Meta, StoryObj } from "@storybook/react";
import { ColumnProps as BaseColumnProps } from "@macrostrat/column-views";
import "@macrostrat/style-system";
import { ColumnUI } from "./column-ui";

const h = hyper.styled(styles);

export default {
  title: "Column views/Column navigation",
  component: ColumnUI,
} as Meta<ColumnUI>;

export function ColumnSelector() {
  return h(ColumnUI);
}
