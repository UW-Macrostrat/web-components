import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { DataSheet, defaultTableActions, EditableTextArea } from "../src";
import type { CellRenderContext } from "../src";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Editors",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

// ---- Test data: alternating short and long notes ----

function buildData(n = 20) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Sample ${i + 1}`,
    note:
      i % 2 === 0
        ? `Short note ${i + 1}`
        : `This is a much longer note for sample ${i + 1} that really wants a ` +
          `multi-line textarea editor rather than a cramped single-line input.`,
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

/**
 * **Workstream C: per-cell editor selection.**
 *
 * `columnSpec[].editorForCell(ctx)` picks the editor for an individual cell
 * from its render context (Workstream B), overriding the static
 * `dataEditor` / `inlineEditor`. Here the `Note` column shows a multi-line
 * `EditableTextArea` (a `dataEditor` popover) only for cells whose value is
 * long; short cells fall back to the default single-line inline input.
 *
 * Click a **short** note → single-line input in the cell. Click a **long**
 * note → a textarea editor pops out. The choice is made per-cell from the
 * value, which a per-column setting alone couldn't express.
 */
export const PerCellEditor: StoryObj = {
  render: () => {
    const columnSpec = [
      { name: "Name", key: "name", width: 160 },
      {
        name: "Note",
        key: "note",
        width: 380,
        editorForCell: (ctx: CellRenderContext) =>
          String(ctx.value ?? "").length > 40
            ? { dataEditor: EditableTextArea }
            : undefined,
      },
    ];

    return h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: defaultTableActions,
    });
  },
};
