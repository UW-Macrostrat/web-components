import { ComponentStory, ComponentMeta } from "@storybook/react";
import h from "@macrostrat/hyper";
import { PrevalentTaxa } from "./prevalent-taxa";

export default {
  title: "Data components/PBDB integration/Prevalent taxa",
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  args: {},
} as ComponentMeta<any>;

const Template: ComponentStory<typeof PrevalentTaxa> = (args) =>
  h(PrevalentTaxa, { ...args });

export const PrevalentTaxaExample = Template.bind();
//PrevalentTaxaExample.name = "Prevalent taxa";
PrevalentTaxaExample.args = { strat_name_id: 1415 };
