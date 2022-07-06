import { useEffect, useState } from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import h from "@macrostrat/hyper";
import { Hierarchy, IHierarchy } from ".";
import { fetchStratNames } from "./fetch";
import { Spinner } from "@blueprintjs/core";

const exampleData: IHierarchy = {
  name: "Rocks",
  subhierarchy: [
    {
      name: "Igneous",
      units: 10,
      active: false,
      subhierarchy: [
        { name: "Rhyolite", units: 2, active: true, subhierarchy: [] },
        { name: "Granite", units: 5, active: false, subhierarchy: [] },
      ],
    },
    {
      name: "Sedimentary",
      units: 100,
      active: false,
      subhierarchy: [
        { name: "Limestone", units: 2, active: false, subhierarchy: [] },
        {
          name: "Sandstone",
          units: 5,
          active: false,
          subhierarchy: [
            { name: "arkose", units: 2, active: false, subhierarchy: [] },
          ],
        },
      ],
    },
  ],
  active: false,
  units: 120,
};

export default {
  title: "Data-components/Hierarchy",
  component: Hierarchy,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  args: {},
} as ComponentMeta<typeof Hierarchy>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof Hierarchy> = (args) =>
  h(Hierarchy, { ...args });

export const SimpleHierarchy = Template.bind({});
SimpleHierarchy.args = exampleData;

export function StratNameHierarchy({
  strat_name_id,
}: {
  strat_name_id: number;
}) {
  const [state, setState] = useState<IHierarchy>();
  console.log(state);

  useEffect(() => {
    async function fetch() {
      const res = await fetchStratNames(strat_name_id);
      setState(res);
    }
    fetch();
  }, [strat_name_id]);

  if (typeof state === "undefined") {
    return h(Spinner);
  }

  return h("div", [
    h("h3", ["A strat name hierarchy from macrostrat for ", state.name]),
    h(Hierarchy, { ...state }),
  ]);
}

StratNameHierarchy.args = {
  strat_name_id: 88021,
};
