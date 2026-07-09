import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { DataSheet, defaultTableActions } from "../src";
import type { TableFilter } from "../src";
import "@blueprintjs/table/lib/css/table.css";
import { FormGroup, SegmentedControl } from "@blueprintjs/core";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Editing",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

// ---- Test data ----
//
// Deliberately includes null and empty-string cells in the `note` column so
// the empty↔null normalization can be exercised.

const categories = ["Igneous", "Metamorphic", "Sedimentary"];

function buildData(n = 40) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Sample ${i + 1}`,
    category: categories[i % categories.length],
    value: (i * 37) % 100,
    // Every third row starts with an explicitly empty note
    note: i % 3 === 0 ? (i % 2 === 0 ? null : "") : `Note ${i + 1}`,
  }));
}

const testData = buildData();

const columnSpec = [
  { name: "Name", key: "name", width: 160, sortable: true },
  { name: "Category", key: "category", width: 140, sortable: true },
  {
    name: "Value",
    key: "value",
    width: 100,
    sortable: true,
    valueRenderer: (d) => `${d}`,
  },
  { name: "Note", key: "note", width: 260 },
];

const categoryFilter: TableFilter = {
  id: "category-filter",
  name: "Category",
  icon: "tag",
  columnKey: "category",
  description: "Show only rows matching a specific rock category.",
  defaultState: { category: "Igneous" },
  filterForm({ state, setState }) {
    return h(
      FormGroup,
      { label: "Category" },
      h(SegmentedControl, {
        options: categories.map((c) => ({ label: c, value: c })),
        value: state?.category ?? "Igneous",
        onValueChange(value) {
          setState({ ...state, category: value });
        },
      }),
    );
  },
  predicate(row, state) {
    if (state?.category == null) return true;
    return row.category === state.category;
  },
};

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
 * **Empty↔null normalization.**
 *
 * The `Note` column has cells that start out `null` or `""`. Click into one
 * of those empty cells and tab/click away _without changing anything_ (or
 * type something and delete it again). The cell should **not** turn green —
 * an edit that leaves an empty cell empty is a no-op.
 *
 * Then confirm real edits still register: type text into an empty note and
 * blur — it turns green. Clear a populated note with `Backspace` — it also
 * registers as an edit.
 */
export const EmptyCellNormalization: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: defaultTableActions,
    }),
};

/**
 * **Filter-aware edit methods.**
 *
 * Sort by `Value` (or `Name`) from the column header menu, and/or activate
 * the `Category` filter. Then exercise the bulk edit paths against the
 * re-ordered rows:
 *
 * - **Fill handle** — select a cell, drag the small corner handle down a few
 *   rows. The value fills the rows you actually see.
 * - **Multi-cell type** — select a range and type; every selected _visible_
 *   cell takes the value.
 * - **Backspace** — select a range and press `Backspace`; the visible cells
 *   clear.
 *
 * Before this fix, these bulk paths used raw selection indices and wrote to
 * the wrong underlying rows once a sort or filter was active.
 */
export const EditsUnderSortAndFilter: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: defaultTableActions,
      filters: [categoryFilter],
    }),
};
