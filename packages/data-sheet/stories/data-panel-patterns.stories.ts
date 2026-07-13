import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  CSSProperties,
  ReactElement,
  ReactNode,
} from "react";
import {
  Button,
  Checkbox,
  PopoverNext,
  SegmentedControl,
  Spinner,
  Tag,
} from "@blueprintjs/core";
import { RegionCardinality } from "@blueprintjs/table";
import { TagEditor, type TagUsage } from "@macrostrat/data-components";
import {
  columnFilter,
  createLocalProvider,
  DataPanel,
  DataPanelItemProps,
  DataView,
  FacetControls,
  FilterBar,
  getSelectedRowIndices,
  useLoadControls,
  useSelector,
  useStoreAPI,
  LoadProgressIndicator,
} from "../src";
import type {
  ColumnSpec,
  FetchDataParams,
  FetchDataResult,
  LoadControls,
  ScrollBodyProps,
  TableAction,
  TableDataProvider,
} from "../src";
import { Box, FlexRow, Spacer } from "@macrostrat/ui-components";

const h = hyper;

/**
 * Progressive-enhancement patterns for `DataPanel`. Scrolling lists are more
 * multi-faceted than a sheet, so the panel exposes a few composable seams —
 * per-column facet opt-in, a `toolbar` slot, a `footer` slot, `bodyStyle` for
 * layout, and `onSelect` for selection — that these stories exercise in
 * isolation. All use a synthetic in-memory dataset (no backend) so the focus is
 * the interaction model, not the data source.
 */

const meta: Meta<any> = {
  title: "Data sheet/Data panel patterns",
  parameters: { layout: "fullscreen" },
};
export default meta;

// ---- Synthetic dataset ----

interface Sample {
  id: number;
  name: string;
  category: string;
  status: string;
  value: number;
  tags: string[];
}

const CATEGORIES = ["Igneous", "Metamorphic", "Sedimentary"];
const STATUSES = ["active", "draft", "archived"];
const TAG_PALETTE = ["priority", "review", "blocked", "verified"];
const CATEGORY_INTENT: Record<string, any> = {
  Igneous: "danger",
  Metamorphic: "primary",
  Sedimentary: "success",
};

const ALL: Sample[] = Array.from({ length: 150 }, (_, i) => ({
  id: i + 1,
  name: `Sample ${String(i + 1).padStart(3, "0")}`,
  category: CATEGORIES[i % 3],
  status: STATUSES[(i >> 1) % 3],
  value: (i * 37) % 100,
  tags: i % 4 === 0 ? [TAG_PALETTE[i % TAG_PALETTE.length]] : [],
}));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// A synthetic server: applies the active filters/sorts (as a real provider
// would) and returns a window — so facets + infinite scroll work end to end.
async function fetchSamples(
  params: FetchDataParams,
): Promise<FetchDataResult<Sample>> {
  const { offset, limit, sorts, filters } = params;
  await sleep(200);
  let rows = ALL.slice();
  for (const f of filters) {
    if (f.predicate != null)
      rows = rows.filter((r) => f.predicate!(r, f.state));
  }
  for (const s of [...sorts].reverse()) {
    rows.sort((a, b) => {
      const av = (a as any)[s.key];
      const bv = (b as any)[s.key];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return s.ascending ? cmp : -cmp;
    });
  }
  return { rows: rows.slice(offset, offset + limit), totalCount: rows.length };
}

const fullSpec: ColumnSpec[] = [
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
    key: "status",
    name: "Status",
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

const container = (child: any) =>
  h(
    "div",
    {
      style: {
        height: "100vh",
        padding: "1em",
        display: "flex",
        flexDirection: "column",
      },
    },
    child,
  );

const cardStyle = (selected: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 10px",
  border: "1px solid rgba(128,128,128,0.25)",
  borderRadius: "4px",
  background: selected ? "rgba(45,114,210,0.12)" : "rgba(128,128,128,0.04)",
});

function SampleCard({ data, selected, onSelect }: DataPanelItemProps<Sample>) {
  return h("div", { onClick: onSelect, style: cardStyle(selected) }, [
    h("span", { key: "n", style: { fontWeight: 600, flex: 1 } }, data.name),
    h(
      Tag,
      { key: "c", minimal: true, intent: CATEGORY_INTENT[data.category] },
      data.category,
    ),
    h("span", { key: "s", style: { fontSize: 12, opacity: 0.7 } }, data.status),
    h("code", { key: "v" }, data.value),
  ]);
}

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
      h("div", {
        key: "sep",
        style: { width: 1, height: 20, background: "rgba(128,128,128,0.3)" },
      }),
      // The default facet menus still available, unchanged.
      h(FacetControls, { key: "facets" }),
    ],
  );
}

export const CustomToolbarStory: StoryObj = {
  name: "Custom toolbar",
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
                background: "rgba(45,114,210,0.06)",
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

// Selection is "modal": a toolbar toggle enters select-mode. Outside it, a card
// is a link (its title navigates); inside it, cards show a checkbox and a click
// selects. So item interactivity and selection never fight over the click.
const SelectModeContext = createContext(false);

function LinkCard({ data, selected, onSelect }: DataPanelItemProps<Sample>) {
  const selectMode = useContext(SelectModeContext);
  return h(
    "div",
    {
      style: cardStyle(selected),
      // In select-mode the whole card toggles (additive) — one consistent
      // interaction. The checkbox is a pure indicator (pointer-events: none),
      // so clicking *it* falls through to the card rather than fighting it.
      onClick: selectMode ? () => onSelect({ additive: true }) : undefined,
    },
    [
      selectMode
        ? h(Checkbox, {
            key: "cb",
            checked: selected,
            readOnly: true,
            style: { margin: 0, pointerEvents: "none" },
          })
        : null,
      // A real link: navigates when not selecting; in select-mode the click is
      // neutralized and bubbles to the card's toggle.
      h(
        "a",
        {
          key: "n",
          href: `#sample-${data.id}`,
          style: { fontWeight: 600, flex: 1 },
          onClick: (e: any) => {
            if (selectMode) e.preventDefault();
            else e.stopPropagation();
          },
        },
        data.name,
      ),
      h(
        Tag,
        { key: "c", minimal: true, intent: CATEGORY_INTENT[data.category] },
        data.category,
      ),
    ],
  );
}

function ModalSelectionDemo() {
  const [selectMode, setSelectMode] = useState(false);
  const toolbar = h(
    "div",
    { style: { display: "flex", gap: "8px", alignItems: "center" } },
    [
      h(
        Button,
        {
          key: "toggle",
          small: true,
          active: selectMode,
          intent: selectMode ? "primary" : "none",
          icon: selectMode ? "tick-circle" : "selection",
          onClick: () => setSelectMode((v) => !v),
        },
        selectMode ? "Selecting" : "Select",
      ),
      h(FacetControls, { key: "facets" }),
    ],
  );
  return h(
    SelectModeContext.Provider,
    { value: selectMode },
    container(
      h(DataPanel<Sample>, {
        data: ALL,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: LinkCard,
        toolbar,
        name: "Samples",
      }),
    ),
  );
}

export const ModalSelection: StoryObj = {
  name: "Linkable items + modal selection",
  render: () => h(ModalSelectionDemo),
};

// ---- 5. Grid layout (several per row) + infinite scroll ----

function GridCard({ data, selected, onSelect }: DataPanelItemProps<Sample>) {
  return h(
    "div",
    {
      onClick: onSelect,
      style: {
        ...cardStyle(selected),
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "4px",
        height: "100%",
      },
    },
    [
      h("span", { key: "n", style: { fontWeight: 600 } }, data.name),
      h(
        Tag,
        { key: "c", minimal: true, intent: CATEGORY_INTENT[data.category] },
        data.category,
      ),
      h("code", { key: "v", style: { fontSize: 12 } }, `value ${data.value}`),
    ],
  );
}

// A custom scroll-body component: lays the cards out as a CSS grid. It's a
// component (not just a style), so it could just as well add section headers,
// sticky bits, or its own windowing — the panel still owns scroll + paging.
function GridScrollBody({ children }: { children: any }) {
  return h(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "8px",
        alignContent: "start",
      },
    },
    children,
  );
}

/**
 * Several items per row via a custom `scrollBody` component. Paging (windowed
 * `fetchData`) and modifier-key selection are layout-agnostic, so infinite
 * scroll and shift/cmd-select keep working across the grid.
 */
export const GridLayout: StoryObj = {
  render: () =>
    container(
      h(DataPanel<Sample>, {
        fetchData: fetchSamples,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: GridCard,
        pageSize: 24,
        name: "Samples",
        scrollBody: GridScrollBody,
      }),
    ),
};

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
        key: field,
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
    h("h6", { key: "t", style: { margin: "0 0 6px" } }, title),
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
    h("h5", { key: "h", style: { marginTop: 0 } }, "Filters"),
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

const TAG_INTENT: Record<string, any> = {
  priority: "danger",
  review: "warning",
  blocked: "none",
  verified: "success",
};

function TaggedCard({ data, selected, onSelect }: DataPanelItemProps<Sample>) {
  return h(
    "div",
    { onClick: (e: any) => onSelect(e), style: cardStyle(selected) },
    [
      h("span", { key: "n", style: { fontWeight: 600, flex: 1 } }, data.name),
      ...(data.tags ?? []).map((t) =>
        h(Tag, { key: t, minimal: true, intent: TAG_INTENT[t] }, t),
      ),
    ],
  );
}

// The add/remove preflight form: pick a palette tag (`detailsForm` pattern).
function TagPickForm({
  state,
  setState,
}: {
  state: { tag: string };
  setState: (s: { tag: string }) => void;
}) {
  return h(SegmentedControl, {
    small: true,
    options: TAG_PALETTE.map((t) => ({ label: t, value: t })),
    value: state?.tag ?? TAG_PALETTE[0],
    onValueChange: (tag: string) => setState({ tag }),
  });
}

// Generic, reusable edit actions — no provider closure, no refresh wiring. They
// read the selected rows and persist through the action context's `saveRows`
// (wired by DataPanel to the provider + auto-refresh). Because they only touch
// the context, they're module-level constants, not per-instance.
function editTagAction(
  id: string,
  name: string,
  icon: any,
  apply: (tags: string[], tag: string) => string[],
): TableAction<Sample, { tag: string }> {
  return {
    id,
    name,
    icon,
    targets: [RegionCardinality.FULL_ROWS],
    requiresEditable: false,
    defaultState: { tag: TAG_PALETTE[0] },
    isReady: (s) => s?.tag != null,
    detailsForm: TagPickForm,
    async run(ctx, state) {
      const rows = ctx.getSelectedRows();
      await ctx.saveRows?.(
        rows.map((r) => ({ ...r, tags: apply(r.tags, state!.tag) })),
      );
      ctx.clearSelection();
    },
  };
}

const addTagAction = editTagAction("add-tag", "Add tag", "tag", (tags, tag) => [
  ...new Set([...tags, tag]),
]);
const removeTagAction = editTagAction(
  "remove-tag",
  "Remove tag",
  "cross",
  (tags, tag) => tags.filter((t) => t !== tag),
);

// A mutable in-memory source with `saveRows` — the data side of the edit. The
// panel wires `saveRows` (+ auto-refresh) onto the action context, so the
// actions above stay generic. (A real page would persist to the API here.)
function makeEditableProvider(): TableDataProvider<Sample> {
  const rows: Sample[] = ALL.map((r) => ({ ...r, tags: [...r.tags] }));
  return {
    ...createLocalProvider<Sample>(rows, { identity: (r) => r.id }),
    async saveRows(updated) {
      for (const u of updated) {
        const i = rows.findIndex((r) => r.id === u.id);
        if (i >= 0) rows[i] = u;
      }
    },
  };
}

function EditTagsDemo() {
  const provider = useMemo(makeEditableProvider, []);
  return container(
    h(DataPanel<Sample>, {
      provider,
      columnSpec: fullSpec,
      itemComponent: TaggedCard,
      actions: [addTagAction, removeTagAction],
      pageSize: 25,
      name: "Samples",
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
  const counter =
    c.total != null ? `${c.loaded} of ${c.total}` : `${c.loaded} loaded`;

  let action: ReactNode;
  if (!c.hasMore) {
    action = h("span", { style: { opacity: 0.6 } }, "— end of list —");
  } else if (c.paused) {
    action = h(
      Button,
      {
        large: true,
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
      h(
        "div",
        { key: "count", style: { fontSize: 12, opacity: 0.6 } },
        counter,
      ),
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
        pageSize: 20,
        autoLoadPages: 2,
        name: "Samples",
        footer: h(InlineFooter),
        statusBar: false,
      }),
    ),
};

// ---- 9. Masonry layout (variable-height items) ----

// Deterministic but wildly variable body length per row (0–8 paragraphs), so
// card heights differ dramatically — the case that makes masonry balancing (and
// reflow) actually matter.
const LIPSUM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod " +
  "tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim " +
  "veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea " +
  "commodo consequat.";
function blurbFor(id: number): string {
  const paragraphs = (id * 7) % 9; // 0–8
  return Array.from({ length: paragraphs }, () => LIPSUM).join("\n\n");
}

function MasonryCard({ data, selected, onSelect }: DataPanelItemProps<Sample>) {
  return h(
    "div",
    {
      onClick: onSelect,
      style: {
        ...cardStyle(selected),
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "4px",
        // Column children need their own vertical gap (multicol has no `gap`
        // between stacked items).
        marginBottom: "8px",
      },
    },
    [
      h("span", { key: "n", style: { fontWeight: 600 } }, data.name),
      h(
        Tag,
        { key: "c", minimal: true, intent: CATEGORY_INTENT[data.category] },
        data.category,
      ),
      h(
        "p",
        {
          key: "b",
          style: {
            margin: 0,
            fontSize: 12,
            opacity: 0.75,
            whiteSpace: "pre-line",
          },
        },
        blurbFor(data.id),
      ),
    ],
  );
}

const MASONRY_COLUMNS = 3;

/**
 * Append-only, height-balanced masonry — the fix for CSS-column reflow. Each
 * item is placed in the shortest column **once** and then frozen, so appending
 * a page never reshuffles what's on screen. Balance comes from *measuring each
 * item's real height* (via a ref on every card) rather than a flat estimate:
 * a freshly-appended batch renders in provisional columns, a `useLayoutEffect`
 * measures it, then greedily assigns each new item to the running-shortest
 * column from real heights and re-renders — all before paint, so only the
 * balanced result is seen. Already-frozen items are never remeasured into a new
 * column, so there's still no reflow. No dependency.
 */
function MasonryScrollBody({ children }: ScrollBodyProps) {
  const items = Children.toArray(children) as ReactElement[];
  const assignRef = useRef<number[]>([]); // finalized index → column
  const heightRef = useRef<number[]>([]); // measured height per index
  const elsRef = useRef<Map<number, HTMLElement>>(new Map());
  const [, bump] = useReducer((x) => x + 1, 0);

  // Reset if the list shrank/reset (sort, filter, refresh).
  if (items.length < assignRef.current.length) {
    assignRef.current = [];
    heightRef.current = [];
  }

  useLayoutEffect(() => {
    for (const [i, el] of elsRef.current)
      heightRef.current[i] = el.offsetHeight;
    const assign = assignRef.current;
    if (assign.length >= items.length) return;
    // Column heights from already-finalized items…
    const colH = new Array(MASONRY_COLUMNS).fill(0);
    for (let i = 0; i < assign.length; i++) {
      colH[assign[i]] += heightRef.current[i] ?? 0;
    }
    // …then greedily place the new batch by its just-measured real heights.
    for (let i = assign.length; i < items.length; i++) {
      let col = 0;
      for (let c = 1; c < MASONRY_COLUMNS; c++) {
        if (colH[c] < colH[col]) col = c;
      }
      assign[i] = col;
      colH[col] += heightRef.current[i] ?? 160;
    }
    bump(); // re-render to move the new batch into its balanced columns
  });

  // Unfinalized (new) items render in a provisional column so they mount and
  // can be measured; the layout effect above then finalizes them.
  const columns: ReactNode[][] = Array.from(
    { length: MASONRY_COLUMNS },
    () => [],
  );
  items.forEach((child, i) => {
    const col = assignRef.current[i] ?? i % MASONRY_COLUMNS;
    columns[col].push(
      cloneElement(child, {
        ref: (el: HTMLElement | null) => {
          if (el) elsRef.current.set(i, el);
          else elsRef.current.delete(i);
        },
      } as any),
    );
  });

  return h(
    "div",
    { style: { display: "flex", gap: "8px", alignItems: "flex-start" } },
    columns.map((col, c) =>
      h(
        "div",
        {
          key: c,
          style: {
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          },
        },
        col,
      ),
    ),
  );
}

/**
 * A masonry layout for variable-height items via a custom `scrollBody`. Uses an
 * append-only, measured column distribution (see `MasonryScrollBody`) so new
 * pages don't reflow the existing layout. Paging and selection are unaffected.
 */
export const Masonry: StoryObj = {
  render: () =>
    container(
      h(DataPanel<Sample>, {
        fetchData: fetchSamples,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: MasonryCard,
        pageSize: 24,
        name: "Samples",
        scrollBody: MasonryScrollBody,
      }),
    ),
};

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
        key: "bar",
        style: { display: "flex", alignItems: "center", gap: "8px" },
      },
      [
        h(
          Button,
          {
            key: "toggle",
            icon: "filter",
            rightIcon: open ? "chevron-up" : "chevron-down",
            active: open,
            onClick: () => setOpen((o) => !o),
          },
          "Filters & Sort",
        ),
        // Active filters stay visible as chips even when the panel is collapsed.
        h(FilterBar, { key: "chips" }),
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

// A spec with a Tags column so the *table* view shows tag edits too (the card
// renders them as chips).
const toggleSpec: ColumnSpec[] = [
  ...fullSpec,
  { key: "tags", name: "Tags", dataType: "array" },
];

function TableCardsDemo() {
  const [view, setView] = useState<"cards" | "table">("cards");
  // One shared provider (data + saveRows); `DataView` also shares one store
  // across the toggle, so selection / sort / filter persist too.
  const provider = useMemo(makeEditableProvider, []);

  const toggle = h(SegmentedControl, {
    small: true,
    options: [
      { label: "Cards", value: "cards" },
      { label: "Table", value: "table" },
    ],
    value: view,
    onValueChange: (v: string) => setView(v as "cards" | "table"),
  });

  return container(
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: "8px",
        },
      },
      [
        h(
          "div",
          {
            key: "bar",
            style: { display: "flex", alignItems: "center", gap: "8px" },
          },
          [h("b", { key: "l" }, "View:"), toggle],
        ),
        h(
          "div",
          {
            key: "view",
            style: {
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            },
          },
          h(DataView<Sample>, {
            view,
            provider,
            columnSpec: toggleSpec,
            actions: [addTagAction, removeTagAction],
            itemComponent: TaggedCard,
            pageSize: 25,
            name: "Samples",
          }),
        ),
      ],
    ),
  );
}

/**
 * **Table ⇄ cards toggle** via `DataView`, which mounts one shared store and
 * swaps the renderer. The same provider, column spec, and (generic) edit
 * actions drive either the card `DataPanel` or the cell `DataSheet`. Because the
 * store is shared, **selection / sort / filter persist across the toggle**, and
 * edits (via the shared edit seam) show in both. The realized headless core:
 * one data + behavior definition, two presentations.
 */
export const TableCardsToggle: StoryObj = {
  name: "Table / cards toggle",
  render: () => h(TableCardsDemo),
};
