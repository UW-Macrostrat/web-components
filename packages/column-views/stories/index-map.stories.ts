import h from "@macrostrat/hyper";

import { ComponentStory, ComponentMeta } from "@storybook/react";
import { ColumnNavigatorMap, MacrostratAPIProvider } from "../src/providers";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Index map",
  component: ColumnNavigatorMap,
} as ComponentMeta<typeof ColumnNavigatorMap>;

interface ColumnIndexMapProps {
  col_id: number;
}

export function BasicColumnNavigatorMap(props: ColumnIndexMapProps) {
  return h(MacrostratAPIProvider, [
    h("div", { style: { width: 300, height: 300 } }, h(ColumnNavigatorMap)),
  ]);
}
