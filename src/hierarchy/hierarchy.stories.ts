import { useEffect, useState } from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import h from "@macrostrat/hyper";
import { Hierarchy, IHierarchy } from ".";
import { fetchStratNames } from "./fetch";
import { Spinner } from "@blueprintjs/core";

const exampleData: IHierarchy = {
  name: "Rocks",
  kinder: [
    {
      name: "Igneous",
      units: 10,
      active: false,
      kinder: [
        { name: "Rhyolite", units: 2, active: true, kinder: [] },
        { name: "Granite", units: 5, active: false, kinder: [] },
      ],
    },
    {
      name: "Sedimentary",
      units: 100,
      active: false,
      kinder: [
        { name: "Limestone", units: 2, active: false, kinder: [] },
        {
          name: "Sandstone",
          units: 5,
          active: false,
          kinder: [{ name: "arkose", units: 2, active: false, kinder: [] }],
        },
      ],
    },
  ],
  active: false,
  units: 120,
};

export default {
  title: "Example/Hierarchy",
  component: Hierarchy,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  args: {},
} as ComponentMeta<typeof Hierarchy>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Hierarchy> = (args) =>
  h(Hierarchy, { ...args });

export const SimpleHierarchy = Template.bind({});
SimpleHierarchy.args = exampleData;

export function StratNameHierarchy({ strat_name_id }) {
  const [state, setState] = useState<Partial<IHierarchy>>({});
  console.log(state);

  useEffect(() => {
    async function fetch() {
      const res = await fetchStratNames(strat_name_id);
      setState(res);
    }
    fetch();
  }, [strat_name_id]);

  if (!state.name) {
    return h(Spinner);
  }

  return h("div", [
    h("h3", ["A strat name hierarchy from macrostrat"]),
    h(Hierarchy, { ...state }),
  ]);
}
StratNameHierarchy.args = {
  strat_name_id: 9574,
};
