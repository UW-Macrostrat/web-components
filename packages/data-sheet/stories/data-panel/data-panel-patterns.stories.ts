import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { ReactNode, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  PopoverNext,
  SegmentedControl,
  Spinner,
} from "@blueprintjs/core";
import { RegionCardinality } from "@blueprintjs/table";
import { TagEditor, type TagUsage } from "@macrostrat/data-components";
import {
  columnFilter,
  ColumnSpec,
  DataPanel,
  ActiveFiltersList,
  getSelectedRowIndices,
  LoadProgressIndicator,
  LoadProgressLabel,
  TableAction,
  useLoadControls,
  useSelector,
  useStoreAPI,
} from "../../src";
import { FlexRow } from "@macrostrat/ui-components";
import {
  addTagAction,
  ALL,
  CATEGORIES,
  container,
  fetchSamples,
  fullSpec,
  makeEditableProvider,
  removeTagAction,
  Sample,
  SampleCard,
  STATUSES,
  TAG_PALETTE,
  TaggedCard,
} from "./utils.ts";

/**
 * Progressive-enhancement patterns for `DataPanel`. Scrolling lists are more
 * multi-faceted than a sheet, so the panel exposes a few composable seams —
 * per-column facet opt-in, a `toolbar` slot, a `footer` slot, `bodyStyle` for
 * layout, and `onSelect` for selection — that these stories exercise in
 * isolation. All use a synthetic in-memory dataset (no backend) so the focus is
 * the interaction model, not the data source.
 */

const meta: Meta<any> = {
  title: "Data sheet/Data panel/Misc. patterns",
  parameters: { layout: "fullscreen" },
};
export default meta;

// ---- Synthetic dataset ----

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

// ---- 2. Custom toolbar (with sane defaults) ----

// A filter object reused by the custom toolbar (same one the default menu would
// build), so the bespoke control and the store stay in sync.
const statusFilter = columnFilter({
  key: "status",
  name: "Status",
  dataType: "string",
} as ColumnSpec);

/** A bespoke toolbar built from the store hooks, sitting alongside the default
 * `FacetControls` — "sane defaults + custom". A segmented Status control and a
 * one-click Value sort drive the same store the default menus do. */
function CustomToolbar() {
  const storeAPI = useStoreAPI();
  const status = useSelector(
    (s: any) => s.activeFilters.get(statusFilter.id)?.state?.value ?? "all",
  );
  const valueSort = useSelector((s: any) =>
    s.columnSorts.find((x: any) => x.key === "value"),
  );

  const setStatus = (v: string) => {
    const st = storeAPI.getState();
    if (v === "all") st.removeFilter(statusFilter.id);
    else
      st.setFilter(statusFilter.id, statusFilter, { operator: "eq", value: v });
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

// ---- 3. Footer below the scroll ----

/** A pinned `footer` slot below the scroll body — a persistent summary / action
 * bar that doesn't scroll with the list. */
export const WithFooter: StoryObj = {
  render: () =>
    container(
      h(DataPanel<Sample>, {
        data: ALL,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: SampleCard,
        name: "Samples",
        statusBar: h(FlexRow, [
          h(
            "div",
            {
              style: {
                alignItems: "center",
                display: "flex",
                flexDirection: "row",
                gap: "8px",
                padding: "8px 10px",
                marginRight: "auto",
              },
            },
            [
              h(
                "span",
                { key: "t", style: { flex: 1 } },
                "Bulk actions apply to the current view",
              ),
              h(
                Button,
                { key: "e", small: true, icon: "export" },
                "Export all",
              ),
              h(
                Button,
                { key: "v", small: true, intent: "primary", icon: "confirm" },
                "Validate all",
              ),
            ],
          ),
          h(LoadProgressIndicator),
        ]),
      }),
    ),
};

// ---- 4. Interactive/linkable items + modal selection ----

// ---- 5. Grid layout (several per row) + infinite scroll ----

// ---- 6. Custom filter sidebar ----

/** One faceted section: a field's values as a click-to-toggle list, driving an
 * `eq` filter on the shared store — the same seam the toolbar menus use, just
 * placed in the sidebar. */
function FacetSection({
  title,
  field,
  options,
}: {
  title: string;
  field: string;
  options: string[];
}) {
  const storeAPI = useStoreAPI();
  const filter = useMemo(
    () =>
      columnFilter({
        name: title,
        dataType: "string",
      } as ColumnSpec),
    [field, title],
  );
  const active = useSelector(
    (s: any) => s.activeFilters.get(filter.id)?.state?.value,
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
 * A faceted **filter sidebar** (`sidebar` slot) instead of the top toolbar
 * menus (`toolbar: null` hides those). The sidebar drives the same store, so
 * the list filters server-side exactly as the menu version would.
 */
export const FilterSidebarStory: StoryObj = {
  name: "Custom filter sidebar",
  render: () =>
    container(
      h(DataPanel<Sample>, {
        data: ALL,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: SampleCard,
        name: "Samples",
        toolbar: null,
        sidebar: h(FilterSidebar),
      }),
    ),
};

// ---- 7. Editing: add / remove tags across a selection ----

function EditTagsDemo() {
  const provider = useMemo(makeEditableProvider, []);
  return container(
    h(DataPanel<Sample>, {
      provider,
      columnSpec: fullSpec,
      itemComponent: TaggedCard,
      actions: [addTagAction, removeTagAction],
      pageSize: 25,
      itemLabel: "sample",
    }),
  );
}

/**
 * **Editing base: bulk add/remove tags.** Select rows (shift/cmd), then "Add
 * tag" / "Remove tag" edit the whole selection. The actions are generic,
 * provider-agnostic module constants: they call `ctx.saveRows` (wired by
 * `DataPanel` to the provider, with auto-refresh) — no `refreshToken` or
 * provider closure. This is the immediate-mode edit seam the card/table views
 * share.
 */
export const EditTags: StoryObj = {
  name: "Edit: add/remove tags",
  render: () => h(EditTagsDemo),
};

// ---- 7b. Full-featured bulk tag editor (via the shared `TagEditor`) ----

// The selected rows, resolved from the shared store — recomputed after each
// edit (auto-refresh) so tag usage stays live while the popover is open.
function useSelectedRows(): Sample[] {
  const selection = useSelector((s: any) => s.selection);
  const data = useSelector((s: any) => s.data);
  return useMemo(
    () =>
      getSelectedRowIndices(selection)
        .map((i) => data[i] as Sample)
        .filter(Boolean),
    [selection, data],
  );
}

// Compute a tag's usage across a set of rows.
function tagUsage(rows: Sample[], tag: string): TagUsage {
  if (rows.length === 0) return "none";
  let n = 0;
  for (const r of rows) if (r.tags?.includes(tag)) n++;
  return n === 0 ? "none" : n === rows.length ? "all" : "partial";
}

// The "tool configuration": lightly couple the shared `TagEditor` to the data
// view — usage from the selected rows, `onChange`/`onCreate` through the shared
// edit seam (`rowEditing.saveRows`, auto-refresh, selection preserved).
function TagEditorControl() {
  const rows = useSelectedRows();
  const data = useSelector((s: any) => s.data);
  const storeAPI = useStoreAPI();
  const [created, setCreated] = useState<string[]>([]);

  // Available tags: base palette ∪ tags on loaded data ∪ session-created.
  const available = useMemo(() => {
    const set = new Set<string>([...TAG_PALETTE, ...created]);
    for (const r of data as Sample[]) {
      if (r != null) for (const t of r.tags ?? []) set.add(t);
    }
    return [...set].sort();
  }, [data, created]);

  const applyTag = (tag: string, add: boolean) => {
    const save = storeAPI.getState().rowEditing?.saveRows;
    save?.(
      rows.map((r) => ({
        ...r,
        tags: add
          ? [...new Set([...(r.tags ?? []), tag])]
          : (r.tags ?? []).filter((t) => t !== tag),
      })),
    );
  };

  return h(TagEditor, {
    tags: available,
    usage: (tag) => tagUsage(rows, tag),
    onChange: applyTag,
    onCreate: (tag) => {
      setCreated((c) => [...new Set([...c, tag])]);
      applyTag(tag, true);
    },
  });
}

function TagEditorButton() {
  const rows = useSelectedRows();
  return h(
    PopoverNext,
    {
      placement: "bottom-start",
      content: h("div", { style: { padding: "6px" } }, h(TagEditorControl)),
    },
    h(
      Button,
      { small: true, minimal: true, icon: "tag", rightIcon: "caret-down" },
      `Tags (${rows.length})`,
    ),
  );
}

// A live-control edit action (like the sort/filter controls): renders the tag
// editor for the current row selection. Generic + provider-agnostic, so it
// works in both card and table views.
const tagEditorAction: TableAction<Sample> = {
  id: "tag-editor",
  name: "Tags",
  icon: "tag",
  targets: [RegionCardinality.FULL_ROWS],
  requiresEditable: false,
  render: () => h(TagEditorButton),
};

function BulkTagEditorDemo() {
  const provider = useMemo(makeEditableProvider, []);
  return container(
    h(DataPanel<Sample>, {
      provider,
      columnSpec: fullSpec,
      itemComponent: TaggedCard,
      actions: [tagEditorAction],
      pageSize: 25,
      name: "Samples",
    }),
  );
}

/**
 * **Full-featured bulk tag editor.** Select rows, open **Tags** → a searchable
 * list of every available tag, each showing its usage across the selection: a
 * checkbox (all selected have it), an indeterminate box (some do), or empty
 * (none). Click to add-to-all / remove-from-all; type to filter, or create a
 * new tag. Edits apply immediately through the shared edit seam and keep the
 * selection, so multiple tags can be set in one session. Works in card or table
 * view (it's a generic `render` action).
 */
export const BulkTagEditor: StoryObj = {
  name: "Bulk tag editor",
  render: () => h(BulkTagEditorDemo),
};

// ---- 8. Inline pausing footer + "Load more" (chrome out of the scroll flow) ----

// A deliberately space-taking inline footer, living at the end of the scroll
// flow (so it's seen only at the bottom). It folds in the counter (no bottom
// status bar), shows a spinner while a burst auto-loads, and a big "Load more"
// at each pause. `autoLoadPages: 2` pauses every second page.
function InlineFooter() {
  const c = useLoadControls();

  let action: ReactNode;
  if (!c.hasMore) {
    action = h("span", { style: { opacity: 0.6 } }, "Complete!");
  } else if (c.paused) {
    action = h(
      Button,
      {
        large: true,
        minimal: true,
        intent: "primary",
        icon: "chevron-down",
        onClick: c.loadMore,
      },
      "Load more",
    );
  } else {
    action = h(
      "span",
      {
        style: {
          display: "flex",
          gap: "8px",
          alignItems: "center",
          opacity: 0.7,
        },
      },
      [h(Spinner, { key: "s", size: 18 }), "Loading more…"],
    );
  }

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
        padding: "36px 16px 56px",
        textAlign: "center",
      },
    },
    [
      action,
      h("div", { style: { fontSize: 12, opacity: 0.6 } }, h(LoadProgressLabel)),
    ],
  );
}

/**
 * **Chrome out of the scroll flow.** The footer is *inline* (`footerPlacement:
 * "inline"`) — the last thing in the scroll, seen only when you reach the
 * bottom — and doubles as the load sentinel: it spins while a burst auto-loads
 * and shows a big "Load more" at each pause (`autoLoadPages: 2` → every second
 * page). The counter is folded into it, so there's no bottom status bar
 * (`statusBar: false`). Default scrollbar clearance + top fade keep the rest of
 * the chrome clear of the content.
 */
export const PausingFooter: StoryObj = {
  name: "Inline pausing footer",
  render: () =>
    container(
      h(DataPanel<Sample>, {
        fetchData: fetchSamples,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: SampleCard,
        itemLabel: "sample",
        pageSize: 20,
        autoLoadPages: 2,
        contentFooter: h(InlineFooter),
        statusBar: false,
      }),
    ),
};

// ---- 9. Masonry layout (variable-height items) ----

// ---- 10. Expandable filter/sort panel ----

// Inline sort controls: one toggle button per sortable field, cycling
// asc → desc → off, driving the shared store (same as the menu, laid out flat).
function SortControls() {
  const storeAPI = useStoreAPI();
  const sorts = useSelector((s: any) => s.columnSorts);
  const fields = [
    { key: "name", label: "Name" },
    { key: "value", label: "Value" },
  ];
  return h("div", { style: { minWidth: "120px" } }, [
    h("h6", { key: "t", style: { margin: "0 0 6px" } }, "Sort"),
    ...fields.map((f) => {
      const s = sorts.find((x: any) => x.key === f.key);
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

// An expandable filter/sort panel as the `toolbar`: collapsed to a toggle +
// active-filter chips, expanding to the full faceted controls. Reuses the same
// store-driven `FacetSection` / `SortControls` / `FilterBar` building blocks.
function ExpandableFilters() {
  const [open, setOpen] = useState(false);
  let panel: ReactNode = null;
  if (open) {
    panel = h(
      "div",
      {
        style: {
          display: "flex",
          gap: "28px",
          padding: "12px",
          marginTop: "4px",
          border: "1px solid rgba(128,128,128,0.25)",
          borderRadius: "4px",
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
  }
  return h("div", { style: { display: "flex", flexDirection: "column" } }, [
    h(
      "div",
      {
        style: { display: "flex", alignItems: "center", gap: "8px" },
      },
      [
        h(
          Button,
          {
            icon: "filter",
            rightIcon: open ? "chevron-up" : "chevron-down",
            active: open,
            onClick: () => setOpen((o) => !o),
          },
          "Filters & Sort",
        ),
        // Active filters stay visible as chips even when the panel is collapsed.
        h(ActiveFiltersList),
      ],
    ),
    panel,
  ]);
}

/**
 * An **expandable filter/sort panel** via the `toolbar` slot: collapsed to a
 * toggle + active-filter chips, expanding to full faceted controls + sort. All
 * of it drives the shared store, reusing `FacetSection` / `SortControls` /
 * `FilterBar` — the toolbar seam takes arbitrary interactive chrome.
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

// ---- 11. Table / cards toggle (shared provider, columns, actions) ----
