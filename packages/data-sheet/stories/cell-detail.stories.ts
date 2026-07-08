import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { DataSheet, defaultTableActions } from "../src";
import type { CellDetailContext } from "../src";
import { Callout, Switch } from "@blueprintjs/core";
import { useState } from "react";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Cell detail",
  parameters: { layout: "fullscreen" },
};

export default meta;

const categories = ["Igneous", "Metamorphic", "Sedimentary"];

function buildData(n = 30) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Sample ${i + 1}`,
    category: categories[i % categories.length],
    value: (i * 37) % 100,
    note: `Field note for sample ${i + 1}.`,
  }));
}

const testData = buildData();

/**
 * A SINGLE `cellDetail` component that adapts to `ctx.editable`: a textarea
 * editor when editable, a read-only Callout when not. The same function serves
 * both the editor and viewer roles — the caller never picks between
 * `dataEditor` and `detailRenderer`.
 */
function NoteDetail(ctx: CellDetailContext) {
  if (ctx.editable) {
    return h("textarea.bp6-input", {
      autoFocus: true,
      defaultValue: ctx.value ?? "",
      style: { minWidth: "18em", minHeight: "6em", fontFamily: "inherit" },
      onBlur: (e) => {
        if (e.target.value !== (ctx.value ?? "")) ctx.onChange(e.target.value);
      },
    });
  }
  return h(
    Callout,
    { title: ctx.row?.name, icon: "info-sign", style: { maxWidth: 280 } },
    [
      h("p", { style: { margin: "0.4em 0 0" } }, ctx.value),
      h(
        "p",
        { style: { margin: "0.4em 0 0", opacity: 0.7 } },
        `${ctx.row?.category} · value ${ctx.row?.value}`,
      ),
    ],
  );
}

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

const baseColumns = [
  { name: "Name", key: "name", width: 150 },
  { name: "Category", key: "category", width: 140 },
  { name: "Value", key: "value", width: 90 },
];

/**
 * **One component, both roles.** The `Note` column is editable, so `NoteDetail`
 * renders its textarea editor. The `Summary` column sets `editable: false`, so
 * the *same* `NoteDetail` renders its read-only Callout. Both use the default
 * popover presentation.
 */
export const EditorAndViewer: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      editable: true,
      actions: defaultTableActions,
      columnSpec: [
        ...baseColumns,
        { name: "Note", key: "note", width: 240, cellDetail: NoteDetail },
        {
          name: "Summary",
          key: "note",
          width: 240,
          editable: false,
          cellDetail: NoteDetail,
        },
      ],
    }),
};

/** **`detailPresentation: "modal"`** — the same editor in a Blueprint dialog
 * instead of a popover. Select the `Note` cell (auto) to open it. */
export const ModalPresentation: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      editable: true,
      actions: defaultTableActions,
      columnSpec: [
        ...baseColumns,
        {
          name: "Note",
          key: "note",
          width: 240,
          cellDetail: NoteDetail,
          detailPresentation: "modal",
        },
      ],
    }),
};

/**
 * A custom **inline** surface — a persistent in-cell renderer (drawn on every
 * row, not a popover). Here it renders a gradient bar proportional to the
 * value. Inline is the presentation to reach for when the surface *is* the
 * cell (gradients, sparklines, compact controls); use a popover/modal when it
 * should overlay.
 */
function ValueScaleDetail(ctx: CellDetailContext) {
  const v = Number(ctx.value) || 0;
  const pct = Math.max(0, Math.min(100, v));
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        boxSizing: "border-box",
        background: `linear-gradient(90deg, rgba(72,175,240,0.55) ${pct}%, transparent ${pct}%)`,
      },
    },
    `${v}`,
  );
}

/** **`detailPresentation: "inline"`** — the surface renders directly in every
 * cell (no popover). This `Value` column draws a gradient bar scaled to the
 * value. */
export const InlinePresentation: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      editable: true,
      actions: defaultTableActions,
      columnSpec: [
        { name: "Name", key: "name", width: 150 },
        { name: "Category", key: "category", width: 140 },
        {
          name: "Value",
          key: "value",
          width: 220,
          editable: false,
          cellDetail: ValueScaleDetail,
          detailPresentation: "inline",
        },
      ],
    }),
};

/**
 * **The same `cellDetail` adapts when the whole table's `editable` toggles.**
 * Flip the switch: the `Note` column's `NoteDetail` swaps between its textarea
 * editor (editable) and its read-only Callout (not) — no column-spec change,
 * just `ctx.editable`.
 */
function EditableToggleDemo() {
  const [editable, setEditable] = useState(true);
  return h("div", { style: { height: "100vh", display: "flex", flexDirection: "column", padding: "2em" } }, [
    h(Switch, {
      checked: editable,
      label: `Table editable: ${editable}`,
      onChange: () => setEditable((e) => !e),
      style: { marginBottom: "0.5em" },
    }),
    h(
      "div",
      { style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } },
      h(DataSheet, {
        data: testData,
        editable,
        actions: defaultTableActions,
        columnSpec: [
          ...baseColumns,
          { name: "Note", key: "note", width: 260, cellDetail: NoteDetail },
        ],
      }),
    ),
  ]);
}

export const TableEditableToggle: StoryObj = {
  render: () => h(EditableToggleDemo),
};
