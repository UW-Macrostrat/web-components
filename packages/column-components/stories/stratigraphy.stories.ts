import h from "@macrostrat/hyper";

import { ComponentStory, ComponentMeta } from "@storybook/react";
import { PubFinderI, Pub } from "@macrostrat/form-components/src";
import { Column, preprocessUnits } from "../../column-views/src";
import res from "../../column-views/stories/data/black-mesa-basin-490.json";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Column components/Zebra Nappe stratigraphic column",
  component: Column,
} as ComponentMeta<typeof Column>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Column> = (args) =>
  h(Column, { ...args });

export function BlackMesaBasin(props: PubFinderI) {
  const units = preprocessUnits(res.success.data);
  return h("div", [h("h2", "Black Mesa Basin"), h(Column, { data: units })]);
}
