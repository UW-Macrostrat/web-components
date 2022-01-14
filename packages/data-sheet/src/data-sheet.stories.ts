import { ComponentStory, ComponentMeta } from "@storybook/react";
import { ErrorBoundary } from "@macrostrat/ui-components";
import h from "@macrostrat/hyper";
import { DataArea, orientationFields } from "./test-sheet";
import { DataSheetMain } from "./main";
import chroma from "chroma-js";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Data sheet",
  component: DataArea,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
} as ComponentMeta<typeof DataArea>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args

function transformData(data: object): GridElement[] {
  return orientationFields.map((d) => {
    return { value: data[d.key] ?? null, className: "test" };
  });
}

const Template: ComponentStory<typeof DataArea> = ({ data }) => {
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

const columnSpec = [
  { name: "Strike", key: "strike" },
  { name: "Dip", key: "dip" },
  { name: "Rake", key: "rake" },
  { name: "Max.", key: "maxError", category: "Errors" },
  { name: "Min.", key: "minError", category: "Errors" },
  {
    name: "Color",
    key: "color",
    required: false,
    isValid: (d) => true, //getColor(d) != null,
    transform: (d) => d,
    //dataEditor: ColorEditor,
  },
];

const cscale = chroma.scale("Spectral");

const repeatedData = [];

for (const i of Array(5000).keys()) {
  repeatedData.push({
    color: cscale(((i % 10) / 10) * Math.random() * 0.2).hex(),
    strike: 10 + Math.random() * 10,
    dip: 5 + Math.random() * 10,
    rake: 20 + Math.random() * 10,
    maxError: 4 + Math.random() * 10,
    minError: 2 + Math.random() * 10,
  });
}

const Template1: ComponentStory<typeof DataSheetMain> = ({ data, columns }) => {
  function transformData(data: object): GridElement[] {
    return columns.map((d) => {
      return { value: data[d.key] ?? null, className: "test" };
    });
  }

  return h(
    ErrorBoundary,
    null,
    h(DataSheetMain, {
      columns: columnSpec,
      width: 500,
      height: 500,
      data: repeatedData.map(transformData),
      valueRenderer: (d) => {
        try {
          return d.value.toFixed(2);
        } catch (e) {
          return d.value;
        }
      },
    })
  );
};

export const Virtualized = Template1.bind({});
Virtualized.args = {
  columns: columnSpec,
  containerWidth: 500,
  height: 500,
  width: 400,
};

// More on args: https://storybook.js.org/docs/react/writing-stories/args
