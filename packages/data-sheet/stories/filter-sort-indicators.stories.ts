import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { ReactNode, useEffect } from "react";
import { FormGroup, Menu, SegmentedControl } from "@blueprintjs/core";
import {
  ActiveFiltersList,
  buildMultiOperatorColumnFilter,
  ColumnFilterMenuItem,
  ColumnSortIndicator,
  ColumnSortMenu,
  ColumnSpec,
  DataSheetProvider,
  FilterIndicator,
  TableFilter,
  useStoreAPI,
} from "../src";

/**
 * The **filter & sort indicators** in isolation.
 *
 * `FilterIndicator` and `ColumnSortIndicator` (and their menu-native siblings
 * `ColumnFilterMenuItem` / `ColumnSortMenu`) are the shared building blocks of
 * every view-state surface in the library — the sheet's status bar, the panel's
 * toolbar, and the unified `ActiveFiltersList` all render *these*. Getting their
 * design right (active vs. inactive affordance, the operator/value label, the
 * removable tag) is the crux of the filter/sort unification, so these stories
 * exercise them on their own, decoupled from any table.
 *
 * They are view-agnostic: each only reads/writes the shared store, so it behaves
 * identically inside a `DataSheet` or a `DataPanel`. To render them without a
 * table we mount a bare `DataSheetProvider` (a `columnSpec` + a few rows) and
 * **seed** its `activeFilters` / `columnSorts` so an indicator can be shown in a
 * given state — the `Harness` below is that shim.
 */
const meta: Meta<any> = {
  title: "Data sheet/Filter & sort indicators",
  parameters: { layout: "padded" },
};
export default meta;

// ---- Shim: a table-less provider whose store we seed ----

interface Sample {
  id: number;
  name: string;
  category: string;
  value: number;
}

const CATEGORIES = ["Igneous", "Metamorphic", "Sedimentary"];

const DATA: Sample[] = [
  { id: 1, name: "Quartzite", category: "Metamorphic", value: 42 },
  { id: 2, name: "Basalt", category: "Igneous", value: 17 },
  { id: 3, name: "Shale", category: "Sedimentary", value: 88 },
];

const SPEC: ColumnSpec[] = [
  {
    key: "name",
    name: "Name",
    dataType: "text",
    filterable: true,
    sortable: true,
  },
  {
    key: "category",
    name: "Category",
    dataType: "string",
    filterable: true,
    sortable: true,
  },
  {
    key: "value",
    name: "Value",
    dataType: "integer",
    filterable: true,
    sortable: true,
  },
];

// A rich (custom) filter, to contrast with the generated operator filter.
const categoryFilter: TableFilter<Sample, { category: string }> = {
  id: "category-filter",
  name: "Category",
  subject: "Category",
  icon: "tag",
  columnKey: "category",
  defaultState: { category: CATEGORIES[0] },
  describeState: (s) => s?.category ?? null,
  filterForm: ({ state, setState }) =>
    h(
      FormGroup,
      { label: "Category", style: { margin: 0 } },
      h(SegmentedControl, {
        small: true,
        options: CATEGORIES.map((c) => ({ label: c, value: c })),
        value: state?.category ?? CATEGORIES[0],
        onValueChange: (category: string) => setState({ category }),
      }),
    ),
  predicate: (row, s) => s?.category == null || row.category === s.category,
};

const nameFilter = buildMultiOperatorColumnFilter(SPEC[0]);

type SeededFilter = [TableFilter<any, any>, any];
type SeededSort = [string, boolean];

// Seeds the store once on mount, so an indicator can be shown active.
function Seed({
  filters = [],
  sorts = [],
}: {
  filters?: SeededFilter[];
  sorts?: SeededSort[];
}) {
  const storeAPI = useStoreAPI<Sample>();
  useEffect(() => {
    const st = storeAPI.getState();
    for (const [filter, state] of filters)
      st.setFilter(filter.id, filter, state);
    for (const [key, ascending] of sorts) st.setColumnSort(key, ascending);
    // Seed once; the indicators own the state from here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** A table-less provider with a seeded store — the shim that lets the indicator
 * components render (and mutate view state) without a `DataSheet` /
 * `DataPanel`. */
function Harness({
  filters,
  sorts,
  children,
}: {
  filters?: SeededFilter[];
  sorts?: SeededSort[];
  children: ReactNode;
}) {
  return h(
    DataSheetProvider<Sample>,
    { data: DATA, columnSpec: SPEC, identity: (r: Sample) => r.id },
    [h(Seed, { key: "seed", filters, sorts }), children],
  );
}

// ---- Gallery scaffolding ----

const cellStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  padding: "12px",
  border: "1px solid rgba(128,128,128,0.25)",
  borderRadius: "6px",
  minWidth: "180px",
  alignItems: "flex-start" as const,
};

/** One labeled gallery cell, each with its own seeded provider so states are
 * independent. */
function Cell({
  label,
  filters,
  sorts,
  children,
}: {
  label: string;
  filters?: SeededFilter[];
  sorts?: SeededSort[];
  children: ReactNode;
}) {
  return h("div", { style: cellStyle }, [
    h("code", { key: "l", style: { fontSize: 11, opacity: 0.7 } }, label),
    h(Harness, { key: "h", filters, sorts }, children),
  ]);
}

function Gallery({ children }: { children: ReactNode }) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        alignItems: "flex-start",
      },
    },
    children,
  );
}

// ---- 1. FilterIndicator ----

/**
 * `FilterIndicator` in every state. Inactive, it's a dropdown affordance (a
 * "Filter" tag with a caret) opening the filter's `filterForm`; active, it
 * becomes a primary, removable tag showing `describeState`. It works the same
 * for a **standard** operator filter (`columnFilter`) and a **custom** rich
 * filter (`col.filters`), and honors `minimal` (drop the subject) and
 * `showSubject`.
 */
export const FilterIndicators: StoryObj = {
  render: () =>
    h(Gallery, [
      h(Cell, { key: "op-off", label: "operator · inactive" }, [
        h(FilterIndicator, { filter: nameFilter, showSubject: true }),
      ]),
      h(
        Cell,
        {
          key: "op-on",
          label: 'operator · active { ilike "qu" }',
          filters: [[nameFilter, { operator: "ilike", value: "qu" }]],
        },
        [h(FilterIndicator, { filter: nameFilter, showSubject: true })],
      ),
      h(
        Cell,
        {
          key: "op-min",
          label: "operator · active · minimal",
          filters: [[nameFilter, { operator: "ilike", value: "qu" }]],
        },
        [
          h(FilterIndicator, {
            filter: nameFilter,
            showSubject: false,
            minimal: true,
          }),
        ],
      ),
      h(Cell, { key: "rich-off", label: "custom (rich) · inactive" }, [
        h(FilterIndicator, { filter: categoryFilter, showSubject: true }),
      ]),
      h(
        Cell,
        {
          key: "rich-on",
          label: "custom (rich) · active",
          filters: [[categoryFilter, { category: "Igneous" }]],
        },
        [h(FilterIndicator, { filter: categoryFilter, showSubject: true })],
      ),
      h(
        Cell,
        {
          key: "large",
          label: "operator · active · large",
          filters: [[nameFilter, { operator: "eq", value: "Basalt" }]],
        },
        [
          h(FilterIndicator, {
            filter: nameFilter,
            showSubject: true,
            large: true,
          }),
        ],
      ),
    ]),
};

// ---- 2. ColumnSortIndicator ----

/**
 * `ColumnSortIndicator` in every state. Inactive, it's a "sort" affordance;
 * active, it shows the direction (Ascending / Descending) as a primary,
 * removable tag, with an Asc/Desc submenu on click (re-clicking the active
 * direction clears it). `showColumnKey` prefixes the field name (as the unified
 * bar does).
 */
export const SortIndicators: StoryObj = {
  render: () =>
    h(Gallery, [
      h(Cell, { key: "off", label: "inactive" }, [
        h(ColumnSortIndicator, { columnKey: "value", showColumnKey: false }),
      ]),
      h(Cell, { key: "asc", label: "ascending", sorts: [["value", true]] }, [
        h(ColumnSortIndicator, { columnKey: "value", showColumnKey: false }),
      ]),
      h(Cell, { key: "desc", label: "descending", sorts: [["value", false]] }, [
        h(ColumnSortIndicator, { columnKey: "value", showColumnKey: false }),
      ]),
      h(
        Cell,
        {
          key: "key",
          label: "ascending · showColumnKey",
          sorts: [["name", true]],
        },
        [h(ColumnSortIndicator, { columnKey: "name", showColumnKey: true })],
      ),
      h(
        Cell,
        {
          key: "large",
          label: "descending · large",
          sorts: [["value", false]],
        },
        [
          h(ColumnSortIndicator, {
            columnKey: "value",
            showColumnKey: true,
            large: true,
          }),
        ],
      ),
    ]),
};

// ---- 3. Menu-native variants ----

/**
 * The menu-native siblings — `ColumnFilterMenuItem` and `ColumnSortMenu` —
 * rendered inside a Blueprint `Menu`. These are what the sheet's column-header
 * dropdown and the panel's toolbar Filter/Sort menus are built from: the same
 * store-backed state as the tags above, in a menu idiom. Open each submenu to
 * edit the filter / choose a sort direction.
 */
export const MenuVariants: StoryObj = {
  render: () =>
    h(Gallery, [
      h(
        Cell,
        { key: "filter", label: "ColumnFilterMenuItem (operator + rich)" },
        [
          h(Menu, [
            h(ColumnFilterMenuItem, {
              key: "op",
              filter: nameFilter,
              label: "Name",
            }),
            h(ColumnFilterMenuItem, {
              key: "rich",
              filter: categoryFilter,
              label: "Category",
            }),
          ]),
        ],
      ),
      h(Cell, { key: "sort", label: "ColumnSortMenu" }, [
        h(Menu, [
          h(ColumnSortMenu, { key: "n", columnKey: "name", text: "Name" }),
          h(ColumnSortMenu, { key: "v", columnKey: "value", text: "Value" }),
        ]),
      ]),
    ]),
};

// ---- 4. The unified bar these compose into ----

/**
 * `ActiveFiltersList` — the unified view-state bar the sheet and panel both
 * show — is just a row of the indicators above: one `FilterIndicator` per active
 * filter (custom *and* standard) and one `ColumnSortIndicator` per sort. Seeded
 * here with a rich filter, an operator filter, and a sort, so the composition is
 * visible in one place.
 */
export const UnifiedBar: StoryObj = {
  render: () =>
    h(
      Harness,
      {
        filters: [
          [categoryFilter, { category: "Sedimentary" }],
          [nameFilter, { operator: "ilike", value: "sh" }],
        ],
        sorts: [["value", false]],
      },
      h(ActiveFiltersList),
    ),
};
