import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import {
  DataSheet,
  defaultTableActions,
  addRowAction,
  deleteRowsAction,
  resetChangesAction,
  copyAction,
  pasteAction,
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

/** Copy and paste actions. Select cells or rows, copy to clipboard,
 * then select a target cell and paste. Full-row copies also store a
 * ClipboardProxy for potential backend-mediated paste operations. */
export const ClipboardActions: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: [
        copyAction,
        pasteAction,
        addRowAction,
        deleteRowsAction,
        resetChangesAction,
      ],
    }),
};

/** An action to uppercase all values in a column, defined directly
 * on the column spec. It only appears when that column is selected. */
const uppercaseColumnAction: TableAction = {
  id: "uppercase-column",
  name: "Uppercase values",
  icon: "font",
  intent: "primary",
  targets: [RegionCardinality.FULL_COLUMNS],
  requiresEditable: true,
  run(ctx) {
    const keys = ctx.getSelectedColumnKeys();
    const numRows = Math.max(ctx.data.length, ctx.updatedData.length);
    const edits = [];
    for (let i = 0; i < numRows; i++) {
      for (const key of keys) {
        const val = ctx.updatedData[i]?.[key] ?? ctx.data[i]?.[key];
        if (typeof val === "string") {
          edits.push({ rowIndex: i, columnKey: key, value: val.toUpperCase() });
        }
      }
    }
    ctx.editCells(edits);
  },
};

/** Actions defined on column specs. The "Name" column has an
 * "Uppercase values" action, and "Category" has a "Fill category" action.
 * These only appear when their respective columns are selected. */
export const ColumnSpecActions: StoryObj = {
  render: () => {
    const specWithActions = columnSpec.map((col) => {
      if (col.key === "name") {
        return { ...col, actions: [uppercaseColumnAction] };
      }
      if (col.key === "category") {
        return { ...col, actions: [fillValueAction] };
      }
      return col;
    });

    return h(Wrapper, {
      data: testData,
      columnSpec: specWithActions,
      editable: true,
      actions: [
        addRowAction,
        deleteRowsAction,
        renameColumnAction,
        copyAction,
        pasteAction,
        resetChangesAction,
      ],
    });
  },
};

const errorAction: TableAction = {
  id: "error-action",
  name: "Error action",
  icon: "error",
  intent: "danger",
  targets: [
    RegionCardinality.FULL_ROWS,
    RegionCardinality.CELLS,
    RegionCardinality.FULL_COLUMNS,
    RegionCardinality.FULL_TABLE,
  ],
  requiresEditable: false,
  run(ctx) {
    throw new Error(
      `This action targeted ${ctx.selectionCardinality}. But it failed and threw an error!`,
    );
  },
};

/** Defines an action that operates on all selection types, throwing an error
 that will hopefully be caught and displayed as a Toast
*/
export const WithThrowingAction: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: [
        errorAction,
        addRowAction,
        deleteRowsAction,
        resetChangesAction,
      ],
    }),
};
