import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { DataSheet } from "../src";
import type { CellDetailContext } from "../src";
import { Callout } from "@blueprintjs/core";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Detail panels",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

// ---- Test data ----

const categories = ["Igneous", "Metamorphic", "Sedimentary"];

function buildData(n = 40) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Sample ${i + 1}`,
    category: categories[i % categories.length],
    value: (i * 37) % 100,
    description:
      `Field sample ${i + 1}, collected from the ${categories[i % 3]} unit. ` +
      `Recorded value ${(i * 37) % 100} at station ${100 + i}.`,
  }));
}

const testData = buildData();

// A read-only detail panel derived from the cell's row context. Since the
// table isn't editable, `cellDetail` always runs in its viewer role. It never
// takes keyboard focus, so arrow keys keep navigating the table.
function cellDetail(ctx: CellDetailContext) {
  const row = ctx.row ?? {};
  return h(
    Callout,
    {
      title: row.name,
      icon: "info-sign",
      style: { maxWidth: 300 },
    },
    [
      h("p", { style: { margin: "0.5em 0 0" } }, row.description),
      h("p", { style: { margin: "0.5em 0 0", opacity: 0.7 } }, [
        `${row.category} · value ${row.value}`,
      ]),
    ],
  );
}

const columnSpec = [
  { name: "Name", key: "name", width: 160, cellDetail },
  { name: "Category", key: "category", width: 150 },
  { name: "Value", key: "value", width: 100 },
];

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

/**
 * **Read-only detail panels via `columnSpec[].cellDetail`.**
 *
 * The `Name` column carries a `cellDetail` that shows a read-only panel for the
 * selected cell — the *same* surface used for editors, here in its viewer role
 * because the table isn't editable. It uses the same open/close machinery but
 * never takes keyboard focus.
 *
 * In `"auto"` (default): selecting a `Name` cell opens its panel; arrow keys
 * keep navigating the table (the panel follows the selection). **Escape**
 * closes the panel and enters navigation mode (panels stop auto-opening) until
 * you click a cell again.
 */
export const AutoDetailPanel: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: false,
    }),
};

/**
 * **Detail panels, `cellInteraction: "manual"`.**
 *
 * Selecting a `Name` cell does not open the panel; click the cell to open it.
 * Arrow keys navigate throughout; Escape (or navigating away) closes it.
 */
export const ManualDetailPanel: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: false,
      cellInteraction: "manual",
    }),
};
