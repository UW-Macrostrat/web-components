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

// ---- Editor interaction modes (open vs. focus decoupling) ----

const interactionColumns = [
  { name: "Name", key: "name", width: 200 },
  {
    name: "Note",
    key: "note",
    width: 420,
    dataEditor: EditableTextArea,
  },
];

/**
 * **Workstream C: `cellInteraction: "auto"` (default).**
 *
 * Selecting a `Note` cell opens the textarea and focuses it. Arrow keys move
 * the cursor **within** the text; when the cursor reaches the start (↑/←) or
 * end (↓/→) of the text, one more press hands focus back to the table and
 * moves to the adjacent cell — so the keyboard stays operable without the
 * mouse. `Escape` also returns focus to the table.
 *
 * Compare with the single-line and Color editors in `Data sheet/Data sheet`:
 * they relinquish focus the same way.
 */
export const EditorInteractionAuto: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec: interactionColumns,
      editable: true,
      cellInteraction: "auto",
      actions: defaultTableActions,
    }),
};

/**
 * **Workstream C: `cellInteraction: "manual"`.**
 *
 * Selecting a `Note` cell does **not** open the editor; arrow keys navigate
 * the table. Click the cell to open the textarea, which then takes focus;
 * `Escape` (or arrowing off the text edge) returns focus to the table. This
 * matches the legacy `autoFocusEditor: false` behavior.
 */
export const EditorInteractionManual: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec: interactionColumns,
      editable: true,
      cellInteraction: "manual",
      actions: defaultTableActions,
    }),
};
