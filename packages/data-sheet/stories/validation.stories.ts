import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { DataSheet } from "../src";
import type { CellValidation } from "../src";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Validation",
  parameters: { layout: "fullscreen" },
};

export default meta;

// Data with deliberate problems: an empty required name, a malformed email,
// and an unusually high score (a warning, not an error).
function buildData() {
  return [
    { name: "Alice", email: "alice@example.com", score: 50 },
    { name: "", email: "bob@example.com", score: 70 },
    { name: "Carol", email: "not-an-email", score: 80 },
    { name: "Dave", email: "dave@example.com", score: 96 },
    { name: "Erin", email: "erin@example.com", score: 42 },
  ];
}

const columnSpec = [
  // `required` sugar → empty is an error.
  { name: "Name", key: "name", width: 160, required: true },
  {
    name: "Email",
    key: "email",
    width: 240,
    validate: (v: any): CellValidation | null =>
      v && !String(v).includes("@")
        ? { severity: "error", message: "Must be a valid email" }
        : null,
  },
  {
    name: "Score",
    key: "score",
    width: 140,
    validate: (v: any): CellValidation | null =>
      Number(v) > 90
        ? { severity: "warning", message: "Unusually high (over 90)" }
        : null,
  },
];

/**
 * **Cell validation (orthogonal to edit status).**
 *
 * `columnSpec[].validate(value, row)` returns `{ severity, message } | null`;
 * `required` is sugar for an empty-is-error check. Cells render by severity —
 * **error** (red): the empty Name and the malformed Email; **warning**
 * (yellow): the score over 90. Validation overrides the edited-green, so an
 * edit that's still invalid stays red.
 *
 * **Save is blocked by errors** (not warnings): with the errors present, click
 * **Save** → it refuses with a summary. Fix the Name and Email (the warning is
 * fine to leave) → Save goes through. Reset stays scoped to the selection.
 */
export const CellValidationStory: StoryObj = {
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
        // eslint-disable-next-line no-console
        onSave: (ctx) => console.log("Saved", ctx.updatedData),
      }),
    ),
};
