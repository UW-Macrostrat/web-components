import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { DataSheet, ColorCell, ColorPicker } from "../src";
import chroma from "chroma-js";
import "@blueprintjs/table/lib/css/table.css";
import { asChromaColor } from "@macrostrat/color-utils";
import { Box } from "@macrostrat/ui-components";
import { atom, useAtom, useAtomValue } from "jotai";
import { Checkbox, FormGroup, SegmentedControl } from "@blueprintjs/core";
import { RegionCardinality } from "@blueprintjs/table";

const defaultTestData = buildTestData();
const defaultColumnSpec = buildColumnSpec();

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<any> = {
  title: "Data sheet/Selection polarity",
  component: TestDataSheet,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    data: defaultTestData,
    columnSpec: defaultColumnSpec,
  },
};

export default meta;

export const Primary: StoryObj<{}> = {
  args: {},
};

enum EditMode {
  Reshape = "reshape",
  Edit = "edit",
  Select = "select",
}

function createOptionsArray(enumObject: Object) {
  return Object.values(enumObject).map((value) => {
    return {
      label: toTitleCase(value),
      value,
    };
  });
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

const editModeSelectorAtom = atom(EditMode.Select);

function EditModeSelector() {
  const [value, setMode] = useAtom(editModeSelectorAtom);
  return h(
    FormGroup,
    { label: "Edit mode", inline: true },
    h(SegmentedControl, {
      fill: false,
      options: createOptionsArray(EditMode),
      onValueChange: (value) => {
        setMode(value as EditMode);
      },
      value,
    }),
  );
}

const regionCardinalityAtom = atom<RegionCardinality[]>([]);
const toggleRegionCardinalityAtom = atom(
  (get) => get(regionCardinalityAtom) ?? [],
  (get, set, value: RegionCardinality) => {
    const current = get(regionCardinalityAtom) ?? [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    set(regionCardinalityAtom, newValue);
  },
);

function RegionCardinalityCheckboxes() {
  const [cardinality, toggleCardinality] = useAtom(toggleRegionCardinalityAtom);
  const disabled = useAtomValue(editModeSelectorAtom) == EditMode.Reshape;
  return h(
    FormGroup,
    { label: "Region cardinality", inline: true },
    Object.values(RegionCardinality).map((value) => {
      return h(Checkbox, {
        key: value,
        label: toTitleCase(value),
        onChange: () => {
          toggleCardinality(value);
        },
        checked: cardinality.includes(value) ?? false,
        disabled,
      });
    }),
  );
}

export function WithModeToggle() {
  const mode = useAtomValue(editModeSelectorAtom);
  const selectionModes = useAtomValue(regionCardinalityAtom);
  const editable = mode === EditMode.Edit;
  const enableColumnReordering = mode === EditMode.Reshape;
  const enableRowReordering = mode === EditMode.Reshape;

  return h(
    Box,
    {
      padding: "2em",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
    },
    [
      h(EditModeSelector),
      h(RegionCardinalityCheckboxes),
      h(DataSheet, {
        editable,
        data: defaultTestData,
        columnSpec: defaultColumnSpec,
        enableColumnReordering,
        enableRowReordering,
        selectionModes,
      }),
    ],
  );
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
  return h(
    Box,
    {
      padding: "2em",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
    },
    h(DataSheet, props),
  );
}

function buildColumnSpec() {
  return [
    { name: "Strike", key: "strike", valueRenderer, width: 75 },
    { name: "Dip", key: "dip", valueRenderer },
    { name: "Rake", key: "rake", valueRenderer },
    {
      name: "Max.",
      key: "maxError",
      category: "Errors",
      valueRenderer,
      width: 75,
    },
    {
      name: "Min.",
      key: "minError",
      category: "Errors",
      valueRenderer,
      width: 75,
    },
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

  for (const i of Array(50).keys()) {
    const errors = [4 + Math.random() * 10, 2 + Math.random() * 10];
    repeatedData.push({
      color: chroma.mix(
        "red",
        "blue",
        (Math.random() + Math.abs((i % 20) - 10)) / 10,
        "rgb",
      ),
      strike: 10 + Math.random() * 10,
      dip: 5 + Math.random() * 10,
      rake: 20 + Math.random() * 10,
      maxError: Math.max(...errors),
      minError: Math.min(...errors),
      description: `This is a description for item ${i}. It has some random text to fill the space and make it look like a real field book entry. The number is ${i}.`,
    });
  }
  return repeatedData;
}
