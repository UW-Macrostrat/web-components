import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import {
  DataSheet,
  defaultTableActions,
  addRowAction,
  deleteRowsAction,
  resetChangesAction,
} from "../src";
import type { TableAction } from "../src";
import "@blueprintjs/table/lib/css/table.css";
import { FormGroup, InputGroup, SegmentedControl } from "@blueprintjs/core";
import { RegionCardinality } from "@blueprintjs/table";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Table actions",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

// ---- Test data ----

function valueRenderer(d) {
  try {
    return d.toFixed(2);
  } catch {
    return `${d}`;
  }
}

const columnSpec = [
  { name: "Name", key: "name", width: 200 },
  { name: "Value", key: "value", valueRenderer, width: 100 },
  { name: "Category", key: "category", width: 120 },
];

function buildData(n = 50) {
  const categories = ["Igneous", "Metamorphic", "Sedimentary"];
  return Array.from({ length: n }, (_, i) => ({
    name: `Sample ${i + 1}`,
    value: Math.random() * 100,
    category: categories[i % categories.length],
  }));
}

const testData = buildData();

function Wrapper(props) {
  return h(
    "div",
    {
      style: {
        padding: "2em",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      },
    },
    h(DataSheet, props),
  );
}

// ---- Stories ----

/** Default built-in actions (add row, delete rows, reset). These replicate
 * the existing edit toolbar functionality using the new actions system. */
export const BuiltInActions: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: defaultTableActions,
    }),
};

/** Custom action that logs selected rows to the console.
 * Demonstrates a read-only action targeting full-row selections. */
const logSelectionAction: TableAction = {
  id: "log-selection",
  name: "Log selection",
  icon: "console",
  intent: "none",
  targets: [RegionCardinality.FULL_ROWS, RegionCardinality.CELLS],
  requiresEditable: false,
  run(ctx) {
    const indices = ctx.getSelectedRowIndices();
    const rows = indices.map((i) => ctx.data[i] ?? ctx.updatedData[i]);
    console.log("Selected rows:", rows);
  },
};

/** Custom action with a configuration form (detailsForm).
 * Demonstrates the preflight pattern for setting value on selected cells. */
const fillValueAction: TableAction<any, { value: string }> = {
  id: "fill-value",
  name: "Fill category",
  icon: "edit",
  intent: "primary",
  description: "Set the category for all selected rows",
  targets: [RegionCardinality.FULL_ROWS],
  requiresEditable: true,
  defaultState: { value: "Sedimentary" },
  detailsForm({ state, setState }) {
    return h(
      FormGroup,
      { label: "Category value" },
      h(SegmentedControl, {
        options: [
          { label: "Igneous", value: "Igneous" },
          { label: "Metamorphic", value: "Metamorphic" },
          { label: "Sedimentary", value: "Sedimentary" },
        ],
        value: state.value,
        onValueChange(value) {
          setState({ ...state, value });
        },
      }),
    );
  },
  run(ctx, state) {
    const indices = ctx.getSelectedRowIndices();
    ctx.editCells(
      indices.map((rowIndex) => ({
        rowIndex,
        columnKey: "category",
        value: state.value,
      })),
    );
  },
};

/** Mix of built-in and custom actions. Shows how actions dynamically
 * appear and disappear based on the selection cardinality. */
export const CustomActions: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: [
        addRowAction,
        deleteRowsAction,
        logSelectionAction,
        fillValueAction,
        resetChangesAction,
      ],
    }),
};

/** Read-only actions work even when editable is false.
 * Edit-requiring actions are automatically hidden. */
export const ReadOnlyActions: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: false,
      actions: [
        logSelectionAction,
        addRowAction, // This won't show (requiresEditable: true)
      ],
    }),
};

/** Rename a selected column. Demonstrates a column-targeted action
 * with a detailsForm for entering the new name. */
const renameColumnAction: TableAction<any, { newName: string }> = {
  id: "rename-column",
  name: "Rename column",
  icon: "edit",
  intent: "primary",
  description: "Set a new display name for the selected column",
  targets: [RegionCardinality.FULL_COLUMNS],
  requiresEditable: true,
  defaultState: { newName: "" },
  isReady(state) {
    return state.newName.trim().length > 0;
  },
  detailsForm({ state, setState }) {
    return h(
      FormGroup,
      { label: "New column name" },
      h(InputGroup, {
        value: state.newName,
        placeholder: "Enter new name",
        onValueChange(value) {
          setState({ ...state, newName: value });
        },
        autoFocus: true,
      }),
    );
  },
  run(ctx, state) {
    const selectedKeys = ctx.getSelectedColumnKeys();
    const newSpec = ctx.columnSpec.map((col) => {
      if (selectedKeys.includes(col.key)) {
        return { ...col, name: state.newName };
      }
      return col;
    });
    ctx.setState({ columnSpec: newSpec });
  },
};

/** Column actions: select a column header and rename it. */
export const ColumnActions: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: [
        addRowAction,
        deleteRowsAction,
        renameColumnAction,
        fillValueAction,
        resetChangesAction,
      ],
    }),
};
