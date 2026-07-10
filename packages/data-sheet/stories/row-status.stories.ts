import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { Icon } from "@blueprintjs/core";
import { RegionCardinality } from "@blueprintjs/table";
import { DataSheet, defaultTableActions, useSelector } from "../src";
import type { TableAction } from "../src";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Row status",
  parameters: { layout: "fullscreen" },
};

export default meta;

const categories = ["Igneous", "Metamorphic", "Sedimentary"];

const testData = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  name: `Sample ${i + 1}`,
  category: categories[i % categories.length],
  value: (i * 37) % 100,
}));

const columnSpec = [
  { name: "Name", key: "name", width: 160 },
  { name: "Category", key: "category", width: 150 },
  { name: "Value", key: "value", width: 100 },
];

// A consumer-defined row status. Unlike "deleted", omitting a row doesn't stage
// it for removal — it's a view/export state the consumer owns. We toggle it by
// writing arbitrary strings into `rowStatus` directly from the action.
const OMITTED = "omitted";

const omitRowsAction: TableAction = {
  id: "omit-rows",
  name: "Omit",
  icon: "eye-off",
  requiresEditable: false,
  targets: [RegionCardinality.FULL_ROWS],
  run(ctx) {
    const status = [...ctx.rowStatus];
    for (const i of ctx.getSelectedRowIndices()) {
      status[i] = status[i] === OMITTED ? (undefined as any) : OMITTED;
    }
    ctx.setState({ rowStatus: status });
  },
};

/** A status-bar node: live count of omitted rows (reads the store, so it must
 * render inside the sheet — which `statusBar` children do). */
function OmittedCount() {
  const rowStatus = useSelector((s) => s.rowStatus);
  const n = rowStatus.filter((s: any) => s === OMITTED).length;
  return h(
    "span",
    { style: { display: "inline-flex", alignItems: "center", gap: 4 } },
    [h(Icon, { icon: "eye-off", size: 12 }), `${n} omitted`],
  );
}

/**
 * **Extensible row status + custom row headers.**
 *
 * Row status isn't limited to added/deleted: a consumer can define their own
 * status strings and style them. Here **Omit** (select whole rows → toolbar)
 * toggles an `"omitted"` status, styled via `rowStatusStyles` (dimmed +
 * italic, warning intent) — visibly distinct from a staged delete. A
 * `rowHeaderRenderer` marks omitted rows in the gutter, and a `statusBar` node
 * keeps a live omitted count. None of this stages a delete; it's a view state
 * the page owns.
 */
function RowStatusDemo() {
  return h(
    "div",
    {
      style: {
        height: "100vh",
        padding: "2em",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      },
    },
    h(DataSheet, {
      data: testData,
      columnSpec,
      editable: true,
      actions: [...defaultTableActions, omitRowsAction],
      rowStatusStyles: {
        [OMITTED]: {
          cellStyle: { opacity: 0.5, fontStyle: "italic" },
          headerStyle: { opacity: 0.5 },
          intent: "warning",
        },
      },
      rowHeaderRenderer: (ctx) => {
        if (ctx.status !== OMITTED) return null;
        return h(
          "span",
          {
            title: "Omitted",
            style: { display: "inline-flex", alignItems: "center", gap: 3 },
          },
          [ctx.defaultLabel, h(Icon, { icon: "eye-off", size: 10 })],
        );
      },
      statusBar: h(OmittedCount),
    }),
  );
}

export const OmittedRows: StoryObj = {
  render: () => h(RowStatusDemo),
};
