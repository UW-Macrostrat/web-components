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
import { FormGroup, NumericInput, SegmentedControl } from "@blueprintjs/core";

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
    { style: { padding: "2em", height: "100vh", display: "flex", flexDirection: "column" } },
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
  targets: ["full-rows", "cells"],
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
  targets: ["full-rows"],
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
    for (const i of indices) {
      ctx.onCellEdited(i, "category", state.value);
    }
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

/** Actions coexist with the legacy edit toolbar (which has Save/Reset).
 * The actions toolbar is additive—both toolbars render. */
export const AlongsideLegacyToolbar: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: [logSelectionAction, fillValueAction],
      onSaveData(updates, data) {
        console.log("Saving data", updates);
      },
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

