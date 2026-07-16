import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import {
  DataSheet,
  defaultTableActions,
  copyAction,
  pasteAction,
} from "../src";
import type { TableFilter } from "../src";
import "@blueprintjs/table/lib/css/table.css";
import {
  FormGroup,
  SegmentedControl,
  NumericInput,
  InputGroup,
  Button,
} from "@blueprintjs/core";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Filters",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

// ---- Test data ----

const categories = ["Igneous", "Metamorphic", "Sedimentary"];

function buildData(n = 100) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Sample ${i + 1}`,
    value: Math.round(Math.random() * 100),
    category: categories[i % categories.length],
    depth: Math.round(Math.random() * 500),
  }));
}

const testData = buildData();

// This is a generic text search filter
const nameFilter: TableFilter = {
  id: "name-filter",
  name: "Name contains",
  icon: "search",
  columnKey: "name",
  description: "Show only rows where the name contains a string.",
  defaultState: { search: "" },
  describeState: (state) => state?.search,
  filterForm({ state, setState }) {
    return h(InputGroup, {
      placeholder: "Search by name...",
      value: state?.search ?? "",
      onChange(event) {
        setState({ ...state, search: event.target.value });
        // Ensure that we don't delete the selection when clearing this text form
        event.stopPropagation();
      },
    });
  },
  predicate(row, state) {
    if (state?.search == null || state.search === "") return true;
    return row.name.toLowerCase().includes(state.search.toLowerCase());
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

// ---- Filters ----

/** Filter by rock category. The default shows all Igneous samples. */
const categoryFilter: TableFilter = {
  id: "category-filter",
  name: "Category",
  icon: "tag",
  columnKey: "category",
  description: "Show only rows matching a specific rock category.",
  defaultState: { category: "Igneous" },
  describeState: (state) => state?.category ?? null,
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

/** Numeric range filter for the depth column. */
const depthFilter: TableFilter<any, { min: number; max: number }> = {
  id: "depth-filter",
  name: "Depth range",
  icon: "array-numeric",
  columnKey: "depth",
  description: "Show rows with depth within a range.",
  defaultState: { min: 0, max: 250 },
  describeState: (state) => `${state.min}–${state.max}`,
  filterForm({ state, setState }) {
    return h("div", { style: { display: "flex", gap: "8px" } }, [
      h(
        FormGroup,
        { label: "Min" },
        h(NumericInput, {
          value: state.min,
          onValueChange(val) {
            setState({ ...state, min: val });
          },
          min: 0,
          max: 500,
          stepSize: 10,
          fill: true,
        }),
      ),
      h(
        FormGroup,
        { label: "Max" },
        h(NumericInput, {
          value: state.max,
          onValueChange(val) {
            setState({ ...state, max: val });
          },
          min: 0,
          max: 500,
          stepSize: 10,
          fill: true,
        }),
      ),
    ]);
  },
  predicate(row, state) {
    const depth = row.depth ?? 0;
    return depth >= state.min && depth <= state.max;
  },
};

// Rich, column-specific filters live on the column spec, so they show as modal
// filters in each column's header dropdown. `value` has no rich filter, so it
// falls back to the built-in operator filter (it's `filterable`).
const columnSpec = [
  {
    name: "Name",
    key: "name",
    width: 200,
    sortable: true,
    filters: [nameFilter],
  },
  {
    name: "Value",
    key: "value",
    valueRenderer: (d) => d?.toFixed?.(2) ?? `${d}`,
    width: 100,
    sortable: true,
    filterable: true,
  },
  {
    name: "Category",
    key: "category",
    width: 130,
    sortable: true,
    filters: [categoryFilter],
  },
  {
    name: "Depth (m)",
    key: "depth",
    valueRenderer: (d) => d?.toFixed?.(0) ?? `${d}`,
    width: 100,
    sortable: true,
    filters: [depthFilter],
  },
];

// ---- Stories ----

/** A single category filter. Activate it from the "Add filter" button
 * and see the table update to show only matching rows. */
export const CategoryFilter: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: defaultTableActions,
    }),
};

/** Two filters available: category and depth range.
 * Both can be active simultaneously (AND logic). */
export const MultipleFilters: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: defaultTableActions,
    }),
};

/** Filters defined on the column spec itself. The "Category" column
 * carries a filter that only appears in the filter bar because it's
 * declared in `columnSpec[].filters`. */
export const ColumnSpecFilters: StoryObj = {
  render: () => {
    const specWithFilters = columnSpec.map((col) => {
      if (col.key === "category") {
        return { ...col, filters: [categoryFilter] };
      }
      if (col.key === "depth") {
        return { ...col, filters: [depthFilter] };
      }
      return col;
    });

    return h(Wrapper, {
      data: testData,
      columnSpec: specWithFilters,
      editable: true,
      actions: [...defaultTableActions, copyAction, pasteAction],
      // No global filters — they come from the column spec
    });
  },
};

/** Filters combined with clipboard actions. Demonstrates that copy
 * and paste work correctly when rows are filtered. */
export const FiltersWithClipboard: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: [...defaultTableActions, copyAction, pasteAction],
    }),
};

// ---- Sorting stories ----

/** Column-level sort controls. Click a column header's menu icon to
 * sort ascending (A→Z) or descending (Z→A). Active sorts appear as
 * removable tags above the table. Try sorting by different columns. */
export const ColumnSort: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
    }),
};

/** Sorting an editable table. Demonstrates that sort order updates
 * correctly and edits target the correct underlying row even when
 * the display order has changed. */
export const SortableEditable: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: defaultTableActions,
    }),
};

/** Column-level sort and filter in the same table. Both are accessible
 * from each column header's dropdown menu. Active sort and filter state
 * appear as removable tags above the table. Filter first, then sort the
 * filtered results. */
export const SortAndFilter: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      columnSpec,
      editable: true,
      actions: defaultTableActions,
    }),
};

/** Auto-generated column spec. When no explicit `columnSpec` is provided,
 * columns are inferred from the data. Scalar columns (string, number,
 * boolean) automatically get sort and filter controls in their headers. */
export const AutoColumnSpec: StoryObj = {
  render: () =>
    h(Wrapper, {
      data: testData,
      editable: false,
    }),
};
