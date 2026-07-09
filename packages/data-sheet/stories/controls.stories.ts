import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { DataSheet } from "../src";
import type { TableAction } from "../src";
import { RegionCardinality } from "@blueprintjs/table";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Controls",
  parameters: { layout: "fullscreen" },
};

export default meta;

const categories = ["Igneous", "Metamorphic", "Sedimentary"];

function buildData(n = 40) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Sample ${i + 1}`,
    category: categories[i % categories.length],
    value: (i * 37) % 100,
  }));
}

const columnSpec = [
  { name: "Name", key: "name", width: 200, sortable: true, filterable: true },
  {
    name: "Category",
    key: "category",
    width: 160,
    sortable: true,
    filterable: true,
  },
  { name: "Value", key: "value", width: 120, sortable: true, filterable: true },
];

// A custom, non-keyboard row action — the kind of thing the toolbar is for.
const exportRowsAction: TableAction = {
  id: "export-rows",
  name: "Export rows",
  icon: "export",
  targets: [RegionCardinality.FULL_ROWS],
  requiresEditable: false,
  run(ctx) {
    // eslint-disable-next-line no-console
    console.log("Export rows", ctx.getSelectedRowIndices());
  },
};

/**
 * **Modality by selection cardinality — through the one action system.**
 *
 * `sort`/`filter` are ordinary `TableAction`s scoped to `FULL_COLUMNS` (with a
 * `render` for their live popover controls), passed alongside a custom
 * `FULL_ROWS` action. The toolbar shows only what applies to the current
 * selection, with a capsule on the left naming the polarity:
 *
 * - **Select a column** → capsule "Column" + Sort / Filter popovers.
 * - **Select rows** → capsule "Rows" + the custom "Export rows" action.
 * - **Select cells** → capsule "Cells" (no default actions — clearing/deleting
 *   are keyboard-driven; the toolbar is for actions that aren't).
 *
 * The filter popover clears from its own text box; the sort popover offers
 * Ascending / Descending / Clear.
 *
 * **Save / Reset** are built-in, always-present actions (all cardinalities), so
 * the toolbar stays mounted regardless of selection — edit a cell and they
 * enable; with nothing pending they're disabled. `columnControlActions` are
 * auto-included, so only the custom `exportRows` action is passed here.
 */
export const ModalByCardinality: StoryObj = {
  render: () =>
    h(
      "div",
      {
        style: {
          padding: "2em",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        },
      },
      h(DataSheet, {
        data: buildData(),
        columnSpec,
        editable: true,
        actions: [exportRowsAction],
        // eslint-disable-next-line no-console
        onSave: (ctx) => console.log("Save", ctx.updatedData),
      }),
    ),
};
