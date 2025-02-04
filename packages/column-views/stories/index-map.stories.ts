import h from "@macrostrat/hyper";

import { Meta } from "@storybook/react";
import { ColumnNavigatorMap, MacrostratAPIProvider } from "../src";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Index map",
  component: ColumnNavigatorMap,
} as Meta<typeof ColumnNavigatorMap>;

interface ColumnIndexMapProps {
  col_id: number;
}

export function BasicColumnNavigatorMap(props: ColumnIndexMapProps) {
  return h(MacrostratAPIProvider, [
    h("div", { style: { width: 300, height: 300 } }, h(ColumnNavigatorMap)),
  ]);
}
