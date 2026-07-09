import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { DataSheet, defaultTableActions } from "../src";
import type { CellRenderContext } from "../src";
import { Cell } from "@blueprintjs/table";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Cell rendering",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

// ---- Test data ----

const categories = ["Igneous", "Metamorphic", "Sedimentary"];

function buildData(n = 30) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Sample ${i + 1}`,
    category: categories[i % categories.length],
    value: (i * 37) % 100,
    note: `Note ${i + 1}`,
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
 * **Render context passed to `valueRenderer`.**
 *
 * `valueRenderer` now receives a second argument — a `CellRenderContext` with
 * `{ value, rowIndex, colIndex, column, row, isEdited, isDeleted }`. This
 * story uses it three ways:
 *
 * - **`#` column** — renders `ctx.rowIndex + 1` regardless of the cell value
 *   (a positional row number).
 * - **`Value` column** — colors the number using a _sibling_ field
 *   (`ctx.row.category`), i.e. cross-column rendering that wasn't possible
 *   when the renderer only received the bare value.
 * - **`Name` column** — appends a ✎ marker when `ctx.isEdited` is true. The
 *   table is editable, so edit a name and blur to see the marker appear.
 */
export const ValueRendererContext: StoryObj = {
  render: () => {
    const columnSpec = [
      {
        name: "#",
        key: "name", // any non-empty key; we render the index, not the value
        width: 50,
        valueRenderer: (_d: any, ctx?: CellRenderContext) =>
          `${(ctx?.rowIndex ?? 0) + 1}`,
      },
      {
        name: "Name",
        key: "name",
        width: 200,
        valueRenderer: (d: any, ctx?: CellRenderContext) =>
          ctx?.isEdited ? `${d} ✎` : d,
      },
      { name: "Category", key: "category", width: 150 },
      {
        name: "Value",
        key: "value",
        width: 120,
        valueRenderer: (d: any, ctx?: CellRenderContext) =>
          h(
            "span",
            {
              style: {
                color:
                  ctx?.row?.category === "Igneous" ? "#0f9960" : undefined,
                fontWeight: ctx?.row?.category === "Igneous" ? 600 : undefined,
              },
            },
            `${d}`,
          ),
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

/**
 * **Render context passed to a custom `cellComponent`.**
 *
 * A custom `cellComponent` receives the same context as a `cellContext` prop
 * (the default Blueprint `Cell` does not, to avoid leaking unknown props onto
 * the DOM). Here `NoteCell` reads `cellContext.rowIndex` and
 * `cellContext.isEdited` to render a positional prefix and an edited dot.
 * Edit a note and blur to see the dot appear.
 *
 * Note: a custom `cellComponent` also wraps the editor while a cell is being
 * edited, so it should pass `truncated: false` to the underlying Blueprint
 * `Cell` — otherwise mixed/element children (including the editor input)
 * collapse to an ellipsis.
 */
export const CustomCellComponent: StoryObj = {
  render: () => {
    function NoteCell(props: any) {
      // Strip `truncated` and force it off: a Blueprint `Cell` truncates its
      // children by default, which collapses arbitrary/element children (like
      // the editor input this component receives while editing) to an
      // ellipsis. Custom cell components that render mixed content should opt
      // out of truncation.
      const { cellContext, children, truncated, ...rest } = props;
      const ctx: CellRenderContext | undefined = cellContext;
      return h(Cell, { ...rest, truncated: false }, [
        h("span", { style: { opacity: 0.5, marginRight: "0.5em" } }, [
          `${(ctx?.rowIndex ?? 0) + 1}·`,
        ]),
        children,
        ctx?.isEdited
          ? h("span", {
              style: {
                display: "inline-block",
                width: 6,
                height: 6,
                marginLeft: "0.5em",
                borderRadius: "50%",
                background: "#0f9960",
              },
            })
          : null,
      ]);
    }

    const columnSpec = [
      { name: "Name", key: "name", width: 200 },
      { name: "Category", key: "category", width: 150 },
      {
        name: "Note",
        key: "note",
        width: 260,
        cellComponent: NoteCell,
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
