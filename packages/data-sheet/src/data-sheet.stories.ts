import { ComponentStory, ComponentMeta } from "@storybook/react";
import { SaveButton } from "@macrostrat/ui-components";
import h from "@macrostrat/hyper";
import { DataArea, orientationFields } from "./attitude-sheet";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Data sheet",
  component: DataArea,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof SaveButton>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

function transformData(data: object): GridElement[] {
  return orientationFields.map((d) => {
    return { value: data[d.key] ?? null, className: "test" };
  });
}

const Template: ComponentStory<typeof DataArea> = ({ data }) => {
  console.log(data);
  return h(DataArea, { data: data.map(transformData) });
};

export const Primary = Template.bind({});
Primary.args = {
  data: [
    {
      strike: 10,
      dip: 8,
      rake: 2,
      maxError: 20,
      minError: 8,
      color: "#65499e",
    },
    {
      strike: 120,
      dip: 46,
      rake: 5,
      maxError: 45,
      minError: 2,
      color: "dodgerblue",
    },
  ],
};
// More on args: https://storybook.js.org/docs/react/writing-stories/args
