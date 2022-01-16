import { ComponentStory, ComponentMeta } from "@storybook/react";
import h from "@macrostrat/hyper";
import { DataArea, orientationFields } from "./test-sheet";
import { DataSheet } from "./main";
import { ColorEditor } from "./editors";
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
    dataEditor: ColorEditor,
    valueViewer(d) {
      let color = d.value;
      try {
        color.hex();
      } catch (e) {
        color = null;
      }
      return h(
        "span.value-viewer",
        {
          style: {
            color: color?.css(),
            backgroundColor: color?.luminance(0.8).css(),
          },
        },
        color?.hex()
      );
    },
  },
];

const cscale = chroma.scale("Spectral");

const repeatedData = [];

for (const i of Array(5000).keys()) {
  const errors = [4 + Math.random() * 10, 2 + Math.random() * 10];
  repeatedData.push({
    color: chroma.mix(
      "red",
      "blue",
      (Math.random() + Math.abs((i % 20) - 10)) / 10,
      "rgb"
    ),
    strike: 10 + Math.random() * 10,
    dip: 5 + Math.random() * 10,
    rake: 20 + Math.random() * 10,
    maxError: Math.max(...errors),
    minError: Math.min(...errors),
  });
}

const Template1: ComponentStory<typeof DataSheet> = ({ data, columns }) => {
  return h(DataSheet, {
    columns: columnSpec,
    virtualized: true,
    width: 600,
    height: 500,
    data: repeatedData,
    valueRenderer: (d) => {
      try {
        return d.value.toFixed(2);
      } catch (e) {
        return d.value;
      }
    },
  });
};

export const Virtualized = Template1.bind({});
Virtualized.args = {
  columns: columnSpec,
  containerWidth: 500,
  height: 500,
  width: 400,
};

// More on args: https://storybook.js.org/docs/react/writing-stories/args
