import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  FormGroup,
  PopoverNext,
  SegmentedControl,
} from "@blueprintjs/core";
import { RegionCardinality } from "@blueprintjs/table";
import {
  ActiveFiltersList,
  columnFilter,
  ColumnSpec,
  DataPanel,
  TableFilter,
  useSelector,
  useStoreAPI,
} from "../../src";
import {
  ALL,
  CATEGORIES,
  container,
  fullSpec,
  Sample,
  SampleCard,
  STATUSES,
} from "./utils.ts";

/**
 * Filter & sort patterns for `DataPanel`.
 *
 * A card list has no column headers, so the sheet's "open a header dropdown"
 * affordance isn't available. The panel instead exposes the same view state
 * through three composable seams, all driving the one shared store:
 *
 * - **Add** filters/sorts from the toolbar's built-in **Filter** / **Sort**
 *   menus (`useDataPanelControls`, auto-derived from the `filterable` /
 *   `sortable` columns) — or from any bespoke control you drop in a slot.
 * - **See / remove / reconfigure** every active filter *and* sort as a unified
 *   row of tags via `ActiveFiltersList` — the same bar the sheet shows.
 * - Both **custom** filters (a `TableFilter` on `col.filters`) and **standard**
 *   operator filters (`col.filterable` → `columnFilter`) flow through the same
 *   `activeFilters` map, so they render and clear identically.
 *
 * All stories use a synthetic in-memory dataset (no backend) so the focus is
 * the interaction model, not the data source.
 */
const meta: Meta<any> = {
  title: "Data sheet/Data panel/Filtering",
  parameters: { layout: "fullscreen" },
};
export default meta;

// ---- 1. Minimal facets (opt-in / opt-out per column) ----

/**
 * Facets are per-column: `filterable` / `sortable` are opt-in flags on the
 * column spec, so a consumer exposes only what makes sense. Here only
 * `category` is filterable and only `name` / `value` are sortable — the Filter
 * and Sort menus list exactly those, nothing else.
 */
const minimalSpec: ColumnSpec[] = [
  { key: "name", name: "Name", dataType: "text", sortable: true },
  { key: "category", name: "Category", dataType: "string", filterable: true },
  { key: "status", name: "Status", dataType: "string" },
  { key: "value", name: "Value", dataType: "integer", sortable: true },
];

export const MinimalFacets: StoryObj = {
  render: () =>
    container(
      h(DataPanel<Sample>, {
        data: ALL,
        identity: (r: Sample) => r.id,
        columnSpec: minimalSpec,
        itemComponent: SampleCard,
        name: "Samples",
      }),
    ),
};

// ---- 2. Unified filter/sort bar (custom + standard, one representation) ----

// A *custom* (rich) filter: a segmented category picker on `col.filters`. It's
// an ordinary `TableFilter`, so it lands in the same `activeFilters` map — and
// therefore the same tag row — as the standard operator filters on the other
// columns.
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

// One column carries the custom filter; the rest opt into the standard operator
// filter via `filterable`. Everything is `sortable`.
const filterSpec: ColumnSpec[] = [
  { key: "name", name: "Name", dataType: "text", filterable: true, sortable: true },
  {
    key: "category",
    name: "Category",
    dataType: "string",
    filters: [categoryFilter],
    sortable: true,
  },
  { key: "status", name: "Status", dataType: "string", filterable: true, sortable: true },
  { key: "value", name: "Value", dataType: "integer", filterable: true, sortable: true },
];

/**
 * **Unified filter/sort bar.** `ActiveFiltersList` — dropped into the `toolbar`
 * slot so it sits in the top bar beside the default **Filter** / **Sort**
 * menus — renders every active filter *and* every sort as one row of removable,
 * reconfigurable tags. The **custom** category filter (a segmented picker) and
 * the **standard** operator filters on Name / Status / Value are the same kind
 * of tag: added from the Filter menu, cleared from the ✕, reconfigured in the
 * popover. This is the single, unified representation of view state the card
 * list otherwise lacks.
 */
export const UnifiedFilterBar: StoryObj = {
  name: "Unified filter/sort bar",
  render: () =>
    container(
      h(DataPanel<Sample>, {
        data: ALL,
        identity: (r: Sample) => r.id,
        columnSpec: filterSpec,
        itemComponent: SampleCard,
        name: "Samples",
        toolbar: h(ActiveFiltersList),
      }),
    ),
};

// ---- 3. Custom toolbar (bespoke controls alongside the defaults) ----

// A filter object reused by the custom toolbar (the same one the default menu
// would build), so the bespoke control and the store stay in sync.
const statusFilter = columnFilter({
  key: "status",
  name: "Status",
  dataType: "string",
} as ColumnSpec);

/** A bespoke toolbar built from the store hooks, sitting alongside the default
 * Filter / Sort menus — "sane defaults + custom". A segmented Status control
 * and a one-click Value sort drive the same store the default menus do. */
function CustomToolbar() {
  const storeAPI = useStoreAPI<Sample>();
  const status = useSelector(
    (s) => s.activeFilters.get(statusFilter.id)?.state?.value ?? "all",
  );
  const valueSort = useSelector((s) =>
    s.columnSorts.find((x) => x.key === "value"),
  );

  const setStatus = (v: string) => {
    const st = storeAPI.getState();
    if (v === "all") st.removeFilter(statusFilter.id);
    else st.setFilter(statusFilter.id, statusFilter, { operator: "eq", value: v });
  };
  const cycleValueSort = () => {
    const next = valueSort == null ? true : valueSort.ascending ? false : null;
    storeAPI.getState().setColumnSort("value", next);
  };

  return h(
    "div",
    {
      style: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
        flexWrap: "wrap",
      },
    },
    [
      h("div", {
        key: "sep",
        style: { width: 1, height: 20, background: "rgba(128,128,128,0.3)" },
      }),
      h(SegmentedControl, {
        key: "status",
        small: true,
        options: [
          { label: "All", value: "all" },
          ...STATUSES.map((s) => ({ label: s, value: s })),
        ],
        value: status,
        onValueChange: setStatus,
      }),
      h(
        Button,
        {
          key: "sort",
          small: true,
          minimal: true,
          icon:
            valueSort == null
              ? "sort"
              : valueSort.ascending
                ? "sort-asc"
                : "sort-desc",
          onClick: cycleValueSort,
        },
        "Value",
      ),
    ],
  );
}

export const CustomToolbarStory: StoryObj = {
  name: "Custom toolbar children",
  render: () =>
    container(
      h(DataPanel<Sample>, {
        data: ALL,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: SampleCard,
        toolbar: h(CustomToolbar),
        name: "Samples",
      }),
    ),
};

// ---- 4. Faceted filter sidebar ----

/** One faceted section: a field's values as a click-to-toggle list, driving an
 * `eq` filter on the shared store — the same `activeFilters` seam the toolbar
 * menus use, just placed in the sidebar. */
function FacetSection({
  title,
  field,
  options,
}: {
  title: string;
  field: string;
  options: string[];
}) {
  const storeAPI = useStoreAPI<Sample>();
  // A standard operator filter keyed on the field — its `id`
  // (`column-filter:<field>`) is what keeps each section's filter distinct in
  // the store.
  const filter = useMemo(
    () =>
      columnFilter({
        key: field,
        name: title,
        dataType: "string",
      } as ColumnSpec),
    [field, title],
  );
  const active = useSelector(
    (s) => s.activeFilters.get(filter.id)?.state?.value,
  );
  const set = (v: string) => {
    const st = storeAPI.getState();
    if (active === v) st.removeFilter(filter.id);
    else st.setFilter(filter.id, filter, { operator: "eq", value: v });
  };
  return h("div", { style: { marginBottom: "16px" } }, [
    h("h4", { style: { margin: "0 0 6px" } }, title),
    ...options.map((o) =>
      h(
        "div",
        {
          key: o,
          onClick: () => set(o),
          style: {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "2px 4px",
            cursor: "pointer",
            fontWeight: active === o ? 600 : 400,
          },
        },
        [
          h(Checkbox, {
            key: "cb",
            checked: active === o,
            readOnly: true,
            style: { margin: 0, pointerEvents: "none" },
          }),
          o,
        ],
      ),
    ),
  ]);
}

function FilterSidebar() {
  return h("div", [
    h("h3", { style: { marginTop: 0 } }, "Filters"),
    h(FacetSection, {
      title: "Category",
      field: "category",
      options: CATEGORIES,
    }),
    h(FacetSection, {
      title: "Status",
      field: "status",
      options: STATUSES,
    }),
  ]);
}

/**
 * A faceted **filter sidebar** (`sidebar` slot) as an alternative surface for
 * adding filters. Each facet drives the same `activeFilters` store the toolbar
 * menus do, so the list filters exactly as the menu version would — and the
 * top `ActiveFiltersList` reflects whatever the sidebar sets. (The default
 * toolbar Filter/Sort menus still render; there is not yet a prop to suppress
 * them — a `DataPanel` filter loose end.)
 */
export const FilterSidebarStory: StoryObj = {
  name: "Faceted filter sidebar",
  render: () =>
    container(
      h(DataPanel<Sample>, {
        data: ALL,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: SampleCard,
        name: "Samples",
        toolbar: h(ActiveFiltersList),
        sidebar: h(FilterSidebar),
      }),
    ),
};

// ---- 5. Expandable filter/sort panel ----

// Inline sort controls: one toggle button per sortable field, cycling
// asc → desc → off, driving the shared store (same as the menu, laid out flat).
function SortControls() {
  const storeAPI = useStoreAPI<Sample>();
  const sorts = useSelector((s) => s.columnSorts);
  const fields = [
    { key: "name", label: "Name" },
    { key: "value", label: "Value" },
  ];
  return h("div", { style: { minWidth: "120px" } }, [
    h("h6", { key: "t", style: { margin: "0 0 6px" } }, "Sort"),
    ...fields.map((f) => {
      const s = sorts.find((x) => x.key === f.key);
      const next = s == null ? true : s.ascending ? false : null;
      return h(
        Button,
        {
          key: f.key,
          small: true,
          minimal: true,
          fill: true,
          alignText: "left",
          active: s != null,
          icon: s == null ? "sort" : s.ascending ? "sort-asc" : "sort-desc",
          onClick: () => storeAPI.getState().setColumnSort(f.key, next),
        },
        f.label,
      );
    }),
  ]);
}

// An expandable filter/sort panel as the `toolbar`: a toggle button that opens
// a popover of the full faceted controls, with the unified active-filter/sort
// tags always visible beside it. Reuses the store-driven `FacetSection` /
// `SortControls` / `ActiveFiltersList` building blocks.
function ExpandableFilters() {
  const [open, setOpen] = useState(false);

  const panel = h(
    "div",
    {
      style: {
        display: "flex",
        gap: "28px",
        padding: "12px",
      },
    },
    [
      h(FacetSection, {
        key: "cat",
        title: "Category",
        field: "category",
        options: CATEGORIES,
      }),
      h(FacetSection, {
        key: "st",
        title: "Status",
        field: "status",
        options: STATUSES,
      }),
      h(SortControls, { key: "sort" }),
    ],
  );

  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: "8px" } },
    [
      h(
        PopoverNext,
        {
          key: "popover",
          isOpen: open,
          onInteraction: (next: boolean) => setOpen(next),
          content: panel,
          placement: "bottom-start",
        },
        h(
          Button,
          {
            minimal: true,
            small: true,
            icon: "filter",
            rightIcon: open ? "chevron-up" : "chevron-down",
            active: open,
          },
          "Filters & Sort",
        ),
      ),
      // Active filters + sorts stay visible as tags whether the popover is open
      // or not.
      h(ActiveFiltersList, { key: "active" }),
    ],
  );
}

/**
 * An **expandable filter/sort panel** via the `toolbar` slot: a toggle button
 * that opens a popover of the full faceted controls + sort, with the unified
 * active-filter/sort tags always visible beside it. All of it drives the shared
 * store, reusing `FacetSection` / `SortControls` / `ActiveFiltersList` — the
 * toolbar seam takes arbitrary interactive chrome.
 */
export const ExpandableFilterPanel: StoryObj = {
  name: "Expandable filter/sort panel",
  render: () =>
    container(
      h(DataPanel<Sample>, {
        data: ALL,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: SampleCard,
        name: "Samples",
        toolbar: h(ExpandableFilters),
      }),
    ),
};
