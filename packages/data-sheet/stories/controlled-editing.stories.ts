import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { DataSheet, defaultTableActions } from "../src";
import type { EditEvent } from "../src";
import { useState } from "react";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Controlled editing",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

const categories = ["Igneous", "Metamorphic", "Sedimentary"];

function buildData(n = 30) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Sample ${i + 1}`,
    category: categories[i % categories.length],
    value: (i * 37) % 100,
  }));
}

const testData = buildData();

const columnSpec = [
  { name: "Name", key: "name", width: 160 },
  { name: "Category", key: "category", width: 150 },
  { name: "Value", key: "value", width: 100 },
];

/**
 * **Workstream A: the `onEdit(event)` hook.**
 *
 * Every user edit is emitted as a structured `EditEvent` — `setCells`,
 * `deleteRows`, `addRow`, `resetChanges` — in addition to the built-in
 * `updatedData` overlay. This is the write half of the read/write contract: a
 * consumer can capture edits as revertible operations instead of diffing
 * `updatedData` (which is what the map-ingestion page currently hand-rolls).
 *
 * Edit a cell (inline), multi-select and type, fill down, `Backspace` to
 * clear, or use the toolbar's delete/reset — each emits an event in the log on
 * the right. `rowIndex` is the underlying data-row index (stable under
 * sort/filter).
 */
function EditLogDemo() {
  const [log, setLog] = useState<EditEvent[]>([]);
  return h(
    "div",
    {
      style: {
        display: "flex",
        gap: "1em",
        height: "100vh",
        padding: "2em",
        boxSizing: "border-box",
      },
    },
    [
      h(
        "div",
        { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" } },
        h(DataSheet, {
          data: testData,
          columnSpec,
          editable: true,
          actions: defaultTableActions,
          onEdit: (event) => setLog((l) => [...l, event]),
        }),
      ),
      h(
        "div",
        {
          style: {
            width: 340,
            overflow: "auto",
            fontFamily: "monospace",
            fontSize: 11,
            borderLeft: "1px solid var(--muted-border-color, #ccc)",
            paddingLeft: "1em",
          },
        },
        [
          h(
            "div",
            { style: { display: "flex", justifyContent: "space-between" } },
            [
              h("strong", `onEdit events (${log.length})`),
              h(
                "button",
                { onClick: () => setLog([]) },
                "clear",
              ),
            ],
          ),
          ...log
            .slice()
            .reverse()
            .map((event, i) =>
              h(
                "pre",
                {
                  key: log.length - i,
                  style: { margin: "0.4em 0", whiteSpace: "pre-wrap" },
                },
                JSON.stringify(event),
              ),
            ),
        ],
      ),
    ],
  );
}

export const EditEvents: StoryObj = {
  render: () => h(EditLogDemo),
};
