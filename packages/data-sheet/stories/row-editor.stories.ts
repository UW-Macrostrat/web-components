/**
 * Row editor.
 *
 * One row's fields — or a selection's — as a form, derived from the column
 * spec: the column's name is the label, its `valueRenderer` draws the value,
 * its `cellDetail` is the editor when it has one, and otherwise an input
 * follows from `dataType`. Locked and derived columns show read-only; the
 * whole form is a read-only *viewer* when the sheet isn't editable.
 *
 * `SelectedRowEditor` follows the sheet's selection and writes through the
 * store's `onCellEdited`, so an edit made in the form is the same edit as one
 * typed into the grid — it lights the same cell green, reaches the same
 * `onEdit` observer, and is undone by the same Reset. Because it reads the
 * provider's store rather than the grid, it keeps working when the grid isn't
 * on screen.
 *
 * The panel titles itself with what it is doing to how many rows ("Editing 3
 * rows", "Viewing 1 row"), and its ✕ clears the selection. The grid and the
 * panel share one `DataSheetProvider`.
 */
import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { useState } from "react";
import { SegmentedControl, Switch } from "@blueprintjs/core";
import {
  type CellDetailContext,
  type ColumnSpec,
  DataSheetProvider,
  DataSheetRenderer,
  DataViewRendererType,
  RowEditor,
  SelectedRowEditor,
  showRowEditorAction,
  splitDataProviderProps,
} from "../src";
import styles from "./row-editor.stories.module.sass";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper.styled(styles);

const meta: Meta<any> = {
  title: "Data sheet/Row editor",
  parameters: { layout: "fullscreen" },
};

export default meta;

const categories = ["Igneous", "Metamorphic", "Sedimentary"];

interface Row {
  id: number;
  name: string;
  category: string;
  value: number;
  confirmed: boolean;
  note: string | null;
}

function buildData(n = 30): Row[] {
  return Array.from({ length: n }, (_, i) => ({
    id: 200 + i,
    name: `Sample ${i + 1}`,
    category: categories[i % categories.length],
    value: (i * 37) % 100,
    confirmed: i % 4 === 0,
    note: i % 3 === 0 ? null : `Field note for sample ${i + 1}.`,
  }));
}

const data = buildData();

/** A `cellDetail` surface: a segmented picker when editable, the plain value
 * otherwise. The same function serves the grid's popover and the form's
 * field. It declares `multiCell`, so over several rows it shows the shared
 * category (or none, when they differ) and sets every row at once. */
function CategoryDetail(ctx: CellDetailContext) {
  if (!ctx.editable) {
    if (ctx.mixed) return h("span", "Multiple values");
    return h("span", ctx.value);
  }
  return h(SegmentedControl, {
    small: true,
    options: categories.map((c) => ({ label: c, value: c })),
    value: ctx.mixed ? undefined : ctx.value,
    onValueChange: (value) => ctx.onChange(value),
  });
}

/** A `cellDetail` that does NOT declare `multiCell`: fine for one row, shown
 * read-only over several. */
function NoteDetail(ctx: CellDetailContext) {
  if (!ctx.editable) return h("span", ctx.value ?? "—");
  return h("textarea.bp6-input", {
    defaultValue: ctx.value ?? "",
    style: { width: "100%", minHeight: "4em", fontFamily: "inherit" },
    onBlur: (e) => {
      if (e.target.value !== (ctx.value ?? "")) ctx.onChange(e.target.value);
    },
  });
}

const columnSpec: ColumnSpec[] = [
  { key: "id", name: "ID", dataType: "integer", width: 70, editable: false },
  { key: "name", name: "Name", dataType: "string", width: 160, required: true },
  {
    key: "category",
    name: "Category",
    dataType: "string",
    width: 130,
    cellDetail: CategoryDetail,
    multiCell: true,
  },
  {
    key: "value",
    name: "Value",
    dataType: "number",
    width: 90,
    validate(value) {
      if (value == null || value === "") return null;
      if (Number(value) > 100) {
        return { severity: "error", message: "Values are 0–100" };
      }
      if (Number(value) > 80) {
        return { severity: "warning", message: "Unusually high" };
      }
      return null;
    },
  },
  { key: "confirmed", name: "Confirmed", dataType: "boolean", width: 90 },
  {
    key: "note",
    name: "Note",
    dataType: "text",
    width: 240,
    cellDetail: NoteDetail,
  },
];

/**
 * The grid and the panel side by side over one store. `DataSheet` renders its
 * children *inside* its own column, so a side-by-side layout mounts the
 * provider and the renderer separately — the same split as any two views of
 * one store.
 */
function SheetWithEditor({
  editable = true,
  showTable = true,
  note,
}: {
  editable?: boolean;
  showTable?: boolean;
  note?: string;
}) {
  const [providerProps, rendererProps] = splitDataProviderProps<Row>({
    data,
    columnSpec,
    editable,
    identity: (row) => row.id,
    viewType: DataViewRendererType.TABLE,
    actions: [showRowEditorAction],
  } as any);

  return h(DataSheetProvider<Row>, providerProps as any, [
    h.if(note != null)("p.story-note", note),
    h("div.split", [
      h.if(showTable)(
        "div.grid-pane",
        h(DataSheetRenderer<Row>, rendererProps as any),
      ),
      h(
        "div.panel",
        { className: showTable ? undefined : "wide" },
        h(SelectedRowEditor),
      ),
    ]),
  ]);
}

function Story({ children }) {
  return h("div.story", children);
}

/**
 * Select a row and the panel is its form. Select several rows (shift-click
 * the row headers) and the form stands for all of them: a shared value shows
 * as one, differing values read "Multiple values", and a change applies to
 * every row. Category's picker declares `multiCell`, so it edits the
 * selection; Note's surface doesn't, so it is shown read-only until one row is
 * selected. Select a block of cells instead and only those columns are
 * editable — the rest of the row is context.
 */
export const BesideTheSheet: StoryObj<any> = {
  render: () =>
    h(Story, [
      h(SheetWithEditor, {
        note: "Select a row, shift-click for several, or a block of cells.",
      }),
    ]),
};

/** The same form as a read-only row viewer. */
export const RowViewer: StoryObj<any> = {
  render: () => h(Story, [h(SheetWithEditor, { editable: false })]),
};

/**
 * The grid can leave the screen while the form keeps editing: the provider
 * owns the store, and the renderer is just one view of it. Hide the table and
 * the form still edits the rows you had selected, through the same store.
 */
function EditorWithoutTable() {
  const [showTable, setShowTable] = useState(true);
  return h(Story, [
    h(Switch, {
      label: "Show the table",
      checked: showTable,
      onChange: () => setShowTable(!showTable),
    }),
    h(SheetWithEditor, { showTable }),
  ]);
}

export const WithoutTheTable: StoryObj<any> = {
  render: () => h(EditorWithoutTable),
};

/** The store-free form: a row, its edits and an `onChange`, from anywhere. */
function StandaloneForm() {
  const [edits, setEdits] = useState<Partial<Row>>({});
  const row = data[3];
  return h(Story, [
    h(
      "p.story-note",
      `Editing ${row.name} against local state; edits: ${JSON.stringify(edits)}`,
    ),
    h(
      "div.standalone",
      h(RowEditor<Row>, {
        columnSpec,
        row,
        edits,
        panel: true,
        title: `Editing ${row.name}`,
        onChange(key, value) {
          setEdits((prev) => {
            const next = { ...prev, [key]: value };
            if (String(value) === String(row[key])) delete next[key];
            return next;
          });
        },
        onResetField(key) {
          setEdits((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        },
      }),
    ),
  ]);
}

export const Standalone: StoryObj<any> = {
  render: () => h(StandaloneForm),
};
