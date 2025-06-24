import type { Meta, StoryObj } from "@storybook/react";
import hyper from "@macrostrat/hyper";
import { ColorPicker } from "../../data-sheet";
import { DataSheet, ColorCell } from "../src";
import { useMemo } from "react";
import chroma from "chroma-js";
import styles from "./data-sheet.stories.module.sass";
import "@blueprintjs/table/lib/css/table.css";
import { asChromaColor } from "@macrostrat/color-utils";

const h = hyper.styled(styles);

function DataSheetTest(rest) {
  const [data, columnSpec] = useTestData();
  return h(TestDataSheet, { data, columnSpec, ...rest });
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<any> = {
  title: "Data sheet/Data sheet",
  component: DataSheetTest,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const Primary: StoryObj<{}> = {
  args: {},
};

// Now try a version reordering the columns
export const ReorderableColumns: StoryObj<{}> = {
  args: {
    enableColumnReordering: true,
    onColumnsReordered: (oldIndex, newIndex, length) => {
      console.log("Reordered columns", oldIndex, newIndex, length);
    },
  },
  argTypes: {
    columnSpec: {
      control: {
        type: "object",
      },
    },
  },
};

export function useTestData() {
  const columnSpec = useMemo(buildColumnSpec, []);
  const data = useMemo(buildTestData, []);

  return [data, columnSpec];
}

function valueRenderer(d) {
  try {
    return d.toFixed(2);
  } catch (e) {
    return `${d}`;
  }
}

function TestDataSheet(props) {
  /** Data sheet wrapped with some providers for standalone use */
  return h("div.main", [
    h("div.data-sheet-test-container", h(DataSheet, props)),
  ]);
}

function buildColumnSpec() {
  return [
    { name: "Strike", key: "strike", valueRenderer },
    { name: "Dip", key: "dip", valueRenderer },
    { name: "Rake", key: "rake", valueRenderer },
    { name: "Max.", key: "maxError", category: "Errors", valueRenderer },
    { name: "Min.", key: "minError", category: "Errors", valueRenderer },
    {
      name: "Color",
      key: "color",
      required: false,
      isValid: (d) => true, //getColor(d) != null,
      transform: (d) => d,
      dataEditor: ColorPicker,
      valueRenderer: (d) => {
        const color = asChromaColor(d);
        return color?.name() ?? "";
      },
      // Maybe this should be changed to CellProps?
      cellComponent: ColorCell,
    },
  ];
}

function buildTestData() {
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
  return repeatedData;
}
