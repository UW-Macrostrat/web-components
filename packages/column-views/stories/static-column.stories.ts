import h from "@macrostrat/hyper";

import { ComponentStory, ComponentMeta } from "@storybook/react";
import { Column } from "../src";
import res from "./data/black-mesa-basin-490.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column views/Static column",
  component: Column,
  description: "A column rendered using static units",
} as ComponentMeta<typeof Column>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Column> = (args) =>
  h(Column, { ...args });

export function BlackMesaBasin() {
  const units = res.success.data;
  console.log("Units:", units);
  return h("div", [h("h2", "Black Mesa Basin"), h(Column, { units })]);
}
