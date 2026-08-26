import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "./data-panel.stories.module.sass";
import { AnchorButton, InputGroup, SegmentedControl, Tag } from "@blueprintjs/core";
import {
  createPostgRESTProvider,
  DataPanel,
  SelectionInteractionStyle,
  standardizeFilter,
  type ColumnSpec,
  type ItemComponentProps,
  type TableDataProvider,
  type TableFilter,
} from "../../src";

/**
 * The **map browse page** as a `DataPanel`, driven live against the Macrostrat
 * maps PostgREST route (`/api/pg/sources_metadata`). These stories are the
 * acceptance tests for the "ideal map page" UX items:
 *
 *  1. **Data loading + debouncing** — a debounced search that doesn't refetch
 *     per keystroke.
 *  2. **Graceful degradation on API errors** — a route that 401s shows a clear
 *     message, not a blank list or a crash.
 *  3. **A search bar in the top filter panel** — `presentation: "inline"`.
 *  4. **Removing some / all default filters & sorts** — controlled per column.
 *  5. **Arbitrary sidebar content** — the `sidebar` slot.
 *
 * Requires the local Macrostrat stack (`macrostrat.local`).
 */
const endpoint = "https://macrostrat.local/api/pg";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface MapSource {
  source_id: number;
  name: string;
  slug: string;
  scale: string;
  ref_year: string;
  ref_title: string;
  ref_source: string;
  url: string;
}

// ---- Open text search across name / slug / source_id ----

const SEARCH_FILTER_ID = "text-search";
interface SearchState {
  value: string;
}

/** A plain search box — it writes the filter state on every keystroke. The
 * *debouncing* (one refetch once typing settles) is the **library's** job now:
 * the panel's `filterDebounce` prop debounces the view-state → fetch in the
 * loader, so the input stays instant while the query waits (workstream H). */
function SearchInput({
  state,
  setState,
}: {
  state: SearchState;
  setState: (s: SearchState) => void;
}) {
  return h(InputGroup, {
    className: "map-search",
    leftIcon: "search",
    placeholder: "Search maps by name, slug, or ID…",
    value: state?.value ?? "",
    onChange: (e: any) => setState({ value: e.target.value }),
  });
}

const searchFilter: TableFilter<MapSource, SearchState> = {
  id: SEARCH_FILTER_ID,
  name: "Search",
  icon: "search",
  defaultState: { value: "" },
  describeState: (s) => (s?.value ? s.value : null),
  presentation: "inline",
  filterForm: SearchInput,
  predicate: (row, s) => {
    const q = (s?.value ?? "").trim().toLowerCase();
    if (q === "") return true;
    return [row?.name, row?.slug, String(row?.source_id ?? "")].some((v) =>
      v?.toLowerCase?.().includes(q),
    );
  },
};

// ---- Scale filter (segmented, inline within the menu) ----

const SCALES = ["tiny", "small", "medium", "large"];
const scaleFilter: TableFilter<MapSource, { operator: "eq"; value: string | null }> = {
  id: "scale-filter",
  name: "Scale",
  icon: "filter",
  columnKey: "scale",
  defaultState: { operator: "eq", value: null },
  describeState: (s) => s?.value ?? null,
  presentation: "menu-inline",
  predicate: (row, s) => s?.value == null || row.scale === s.value,
  filterForm: ({ state, setState }) =>
    h(SegmentedControl, {
      small: true,
      options: SCALES.map((v) => ({ label: v, value: v })),
      value: state?.value ?? "",
      onValueChange: (value: string) => setState({ operator: "eq", value }),
    }),
};

// Column facets: a sortable ID and a scale filter. The multi-field search is
// NOT a column — it's a **sheet-level filter** (the `filters` prop), since it
// spans several fields and maps to no single column. (A synthetic column whose
// key matches no data field isn't a supported shape.)
const fullColumnSpec: ColumnSpec[] = [
  { key: "source_id", name: "ID", dataType: "integer", sortable: true },
  { key: "scale", name: "Scale", dataType: "string", filters: [scaleFilter] },
];

// ---- Providers ----

function translateFilter(f: any) {
  // The multi-field search is the one custom translation; other filters (scale)
  // are standard scalar `columnKey=op.value`.
  console.log("translateFilter", f);
  if (f.id !== SEARCH_FILTER_ID) {
    const s = f.state;
    const key = f.columnKey ?? s?.key;
    if (key != null && s?.operator != null && s?.value != null && s.value !== "") {
      return standardizeFilter({ key, operator: s.operator, value: s.value });
    }
    return null;
  }
  const q = (f.state?.value ?? "").trim();
  if (q === "") return null;
  const like = `"*${q.replace(/"/g, "")}*"`;
  const parts = [`name.ilike.${like}`, `slug.ilike.${like}`];
  if (/^\d+$/.test(q)) parts.push(`source_id.eq.${q}`);
  return { type: "filter" as const, apply: (req: any) => req.or(parts.join(",")) };
}

const provider = createPostgRESTProvider<MapSource>({
  endpoint,
  table: "sources_metadata",
  identityKey: "source_id",
  identityAscending: false,
  translateFilter,
});

/** A provider that always fails — stands in for the whole PostgREST route
 * returning 401. Deterministic (no dependency on server auth config). */
const failingProvider: TableDataProvider<MapSource> = {
  identity: (row) => row.source_id,
  async fetchData() {
    await sleep(400);
    throw new Error(
      "401 Unauthorized — the PostgREST route rejected the request.",
    );
  },
};

// ---- Card ----

function MapCard({ data }: ItemComponentProps<MapSource>) {
  return h("a.map-card", { href: `/maps/${data.source_id}` }, [
    h("div.card-header", [
      h("span.map-name", data.name ?? data.slug),
      h.if(data.scale != null)(Tag, { minimal: true, children: data.scale }),
    ]),
    h("div.map-meta", [
      h.if(data.ref_year != null)("span", data.ref_year),
      h("span", `#${data.source_id}`),
    ]),
  ]);
}

// ---- Story harness ----

interface MapPanelProps {
  provider?: TableDataProvider<MapSource>;
  columnSpec?: ColumnSpec[];
  filters?: TableFilter[];
  sidebar?: any;
}

function MapPanel({
  provider: prov = provider,
  columnSpec = fullColumnSpec,
  filters = [searchFilter],
  sidebar,
}: MapPanelProps) {
  return h(
    "div.data-panel-container",
    h(DataPanel<MapSource>, {
      provider: prov,
      columnSpec,
      filters,
      itemComponent: MapCard,
      pageSize: 20,
      autoLoadPages: 3,
      // Debounce the view-state → refetch (workstream H): typing in the search
      // stays instant, but the query only fires once you pause.
      filterDebounce: 300,
      enableSelection: SelectionInteractionStyle.NEVER,
      sidebar,
    }),
  );
}

const meta: Meta<typeof MapPanel> = {
  title: "Data sheet/Map page",
  component: MapPanel,
};
export default meta;

/**
 * 1. **Data loading + debouncing.** Type in the search box: the input is
 * instant, but the queue only refetches ~300ms after you stop typing
 * (`filterDebounce: 300` — the loader debounces the view-state → fetch), so a
 * multi-character search issues one request, not one per keystroke. On a view
 * change or the next scroll page the body fills with skeleton cards where rows
 * will land — no blank flash, no footer pinging up into the list.
 */
export const DataLoadingAndDebouncing: StoryObj = {};

/**
 * 2. **Graceful degradation on API errors.** The provider always 401s; the
 * panel shows a clear "Couldn't load data" state (and the footer an error
 * chip) instead of a blank list or a crash.
 */
export const GracefulDegradationOnError: StoryObj = {
  render: () => h(MapPanel, { provider: failingProvider }),
};

/**
 * 3. **A search bar in the top filter panel.** The search filter declares
 * `presentation: "inline"`, so it renders as an always-visible control in the
 * toolbar alongside the Sort menu and the (menu-inline) Scale filter — rather
 * than hidden behind a dropdown.
 */
export const SearchBarInFilterPanel: StoryObj = {};

/**
 * 4a. **Removing default filters/sorts — keep only search.** The column spec
 * declares just the inline search (no `sortable`, no other `filters`), so the
 * Sort and Filter menus disappear entirely — only the search bar remains.
 */
export const OnlySearch: StoryObj = {
  render: () => h(MapPanel, { columnSpec: [], filters: [searchFilter] }),
};

/**
 * 4b. **Removing default filters/sorts — sort only.** No filters at all; a
 * single sortable column. Removal is per-column: you add capability by
 * declaring `filterable`/`sortable`, and remove it by omitting them.
 */
export const SortOnly: StoryObj = {
  render: () =>
    h(MapPanel, {
      columnSpec: [
        { key: "source_id", name: "ID", dataType: "integer", sortable: true },
      ],
      filters: [],
    }),
};

/**
 * 5. **Arbitrary sidebar content.** The `sidebar` slot takes any nodes — here a
 * static info panel with links — rendered beside the scrolling list, with no
 * bespoke layout plumbing.
 */
export const ArbitrarySidebarContent: StoryObj = {
  render: () =>
    h(MapPanel, {
      sidebar: h("div.map-sidebar", { style: { padding: "1em", minWidth: "200px" } }, [
        h("h3", "Maps"),
        h("p", "Browse Macrostrat's source maps. Use search to find a map by name, slug, or ID."),
        h(AnchorButton, { minimal: true, icon: "flows", href: "/maps/ingestion" }, "Ingestion system"),
        h(AnchorButton, { minimal: true, icon: "map", href: "/map/sources" }, "Show on map"),
      ]),
    }),
};
