import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import {
  type ActiveFilterEntry,
  type ColumnSort,
  compareRowsBySorts,
  DataPanel,
  distinctValuesOf,
  type TableDataProvider,
  type TableFilter,
  useDistinctValues,
} from "../../src";
import { ALL, container, fullSpec, Sample, SampleCard } from "./utils.ts";
import { Checkbox, Spinner, Tag } from "@blueprintjs/core";
import { useCallback, useState } from "react";

/**
 * Starting a view somewhere other than the beginning — and knowing what it cost.
 *
 * Three related props, each removing a wasted request:
 *
 *  - **`initialFilters` / `initialSorts`** apply when the store is *created*, so
 *    a restored view (a link, a saved query) fetches the right rows once.
 *    Applying them in an effect instead — the only option before — meant the
 *    unfiltered first page always went out and was immediately superseded.
 *  - **`initialData`** seeds the first window from rows the caller already has,
 *    so a server-rendered page doesn't re-request what it just shipped.
 *  - **`distinctValues`** on the provider (via `useDistinctValues`) lets a value
 *    picker offer only what the column actually holds — one small grouped query
 *    instead of paging the table to find out.
 *
 * Every story here shows a **fetch log**, so the saving is visible rather than
 * asserted: watch how many requests each arrangement makes on mount, and what
 * view state the first one carries.
 */
const meta: Meta<any> = {
  title: "Data sheet/Data panel/Initial state",
  parameters: { layout: "fullscreen" },
};
export default meta;

const PAGE_SIZE = 20;

// ---- A provider that reports what it was asked for ----

interface FetchRecord {
  offset: number;
  limit: number;
  filters: string[];
  sorts: string[];
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Applies filters and sorts in memory, but through the real provider seam —
 * so the log shows exactly what a server would have been asked. */
function createLoggingProvider(
  rows: Sample[],
  onFetch: (record: FetchRecord) => void,
): TableDataProvider<Sample> {
  const view = (filters: any[], sorts: ColumnSort[]) => {
    let out = rows;
    for (const f of filters) {
      if (f.predicate == null) continue;
      out = out.filter((row) => f.predicate(row, f.state));
    }
    if (sorts.length > 0) out = [...out].sort(compareRowsBySorts(sorts));
    return out;
  };

  return {
    identity: (row) => row.id,
    async fetchData({ offset, limit, filters, sorts }) {
      onFetch({
        offset,
        limit,
        filters: filters.map((f) => f.id),
        sorts: sorts.map((s) => `${s.key}${s.ascending ? "↑" : "↓"}`),
      });
      await delay(500);
      const out = view(filters, sorts);
      return {
        rows: out.slice(offset, offset + limit),
        totalCount: out.length,
      };
    },
    async distinctValues(columnKey) {
      await delay(250);
      return distinctValuesOf(rows, columnKey);
    },
  };
}

/** The provider plus a live record of its calls. */
function useLoggingProvider() {
  const [records, setRecords] = useState<FetchRecord[]>([]);
  const onFetch = useCallback((record: FetchRecord) => {
    setRecords((prev) => [...prev, record]);
  }, []);
  const [provider] = useState(() => createLoggingProvider(ALL, onFetch));
  return { provider, records };
}

function FetchLog({ records }: { records: FetchRecord[] }) {
  const style = {
    padding: "8px 12px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    borderBottom: "1px solid rgba(128,128,128,0.3)",
    fontSize: "12px",
  };

  let rows: any = h("em", "No requests — the view was seeded.");
  if (records.length > 0) {
    rows = records.map((r, i) =>
      h("code", { key: i }, [
        `#${i + 1} rows ${r.offset}–${r.offset + r.limit}`,
        h.if(r.filters.length > 0)(
          "span",
          ` · filters: ${r.filters.join(", ")}`,
        ),
        h.if(r.sorts.length > 0)("span", ` · sort: ${r.sorts.join(", ")}`),
      ]),
    );
  }

  return h("div", { style }, [
    h("strong", { key: "t" }, `Fetches: ${records.length}`),
    h("div", { key: "r" }, rows),
  ]);
}

// ---- A filter whose options come from the data ----

interface CategoryState {
  values: string[];
}

/**
 * The point of `useDistinctValues`: the picker's options are the column's actual
 * values, with their frequencies, fetched once per view and shared by every
 * control that asks. No hand-rolled fetch, no per-consumer cache, and no way to
 * set the filter to something that matches nothing.
 */
function CategoryFilterForm({
  state,
  setState,
}: {
  state: CategoryState;
  setState: (s: CategoryState | null) => void;
}) {
  const { values, loading, supported } = useDistinctValues<string>("category");
  const selected = state?.values ?? [];

  if (loading) return h(Spinner, { size: 16 });
  if (!supported) return h("em", "This source can't list its values.");

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    if (next.length === 0) {
      setState(null);
      return;
    }
    setState({ values: next });
  };

  return h(
    "div",
    { style: { padding: "4px 8px" } },
    values.map(({ value, count }) =>
      h(Checkbox, {
        key: String(value),
        checked: selected.includes(value),
        onChange: () => toggle(value),
        labelElement: h("span", [
          `${value} `,
          h(Tag, { minimal: true, small: true }, count),
        ]),
      }),
    ),
  );
}

const categoryFilter: TableFilter<Sample, CategoryState> = {
  id: "category",
  name: "Category",
  icon: "filter",
  columnKey: "category",
  defaultState: { values: [] },
  presentation: "menu-inline",
  describeState: (s) => {
    const n = s?.values?.length ?? 0;
    if (n === 0) return null;
    if (n === 1) return s.values[0];
    return `${n} categories`;
  },
  predicate: (row, s) => {
    const values = s?.values ?? [];
    return values.length === 0 || values.includes(row.category);
  },
  filterForm: CategoryFilterForm,
};

const columnSpec = fullSpec.map((col) => {
  if (col.key !== "category") return col;
  return { ...col, filters: [categoryFilter], filterable: undefined };
});

// ---- Stories ----

/**
 * Baseline. Open **Filter → Category** and note the option list carries counts
 * pulled straight from the column — one grouped query, not a scan of the table.
 */
export const DistinctValuePicker: StoryObj = {
  render: () => {
    const { provider, records } = useLoggingProvider();
    return container([
      h(FetchLog, { key: "log", records }),
      h(DataPanel<Sample>, {
        key: "panel",
        provider,
        columnSpec,
        itemComponent: SampleCard,
        pageSize: PAGE_SIZE,
        name: "Samples",
        itemLabel: "sample",
      }),
    ]);
  },
};

/**
 * A restored view. The panel comes up already filtered to Igneous samples,
 * sorted by descending value — and the log shows **one** fetch, which already
 * carries both. Applying the same state from an effect would have produced two:
 * the unfiltered page, then the real one.
 */
export const RestoredView: StoryObj = {
  render: () => {
    const { provider, records } = useLoggingProvider();
    const initialFilters: ActiveFilterEntry[] = [
      { filter: categoryFilter, state: { values: ["Igneous"] } },
    ];
    const initialSorts: ColumnSort[] = [{ key: "value", ascending: false }];
    return container([
      h(FetchLog, { key: "log", records }),
      h(DataPanel<Sample>, {
        key: "panel",
        provider,
        columnSpec,
        itemComponent: SampleCard,
        pageSize: PAGE_SIZE,
        name: "Samples",
        itemLabel: "sample",
        initialFilters,
        initialSorts,
      }),
    ]);
  },
};

/**
 * Hydration — the server-rendered case. The first page and the row count were
 * fetched *outside* the panel (here, synchronously from the same dataset; on a
 * real page, during the server render and serialized into the payload) and
 * handed over as `initialData`. The log shows **no** fetch on mount: the panel
 * starts populated, with a correctly-sized scrollbar, and only requests page 2
 * once you scroll to it.
 *
 * Scroll down, then change a filter or sort: the seed is discarded — it only
 * described the view it was fetched for — and the loader takes over normally.
 *
 * Note what this does *not* buy on its own: a crawler renders the page but never
 * scrolls, so it sees the seeded page and nothing beyond it. Making a scrolling
 * list crawlable needs paginated URLs and a real `<a href>` to the next one
 * underneath the scroll — `useLoadControls()` exposes `page` / `pageSize` /
 * `totalPages` for exactly that.
 */
export const HydratedFromServer: StoryObj = {
  render: () => {
    const { provider, records } = useLoggingProvider();
    // Stand-in for what a server render would have serialized into the page.
    const initialData = {
      rows: ALL.slice(0, PAGE_SIZE),
      totalCount: ALL.length,
    };
    return container([
      h(FetchLog, { key: "log", records }),
      h(DataPanel<Sample>, {
        key: "panel",
        provider,
        columnSpec,
        itemComponent: SampleCard,
        pageSize: PAGE_SIZE,
        name: "Samples",
        itemLabel: "sample",
        initialData,
      }),
    ]);
  },
};

/**
 * The two combined, which is the realistic server-rendered arrangement: the
 * server resolved the view from the request URL, fetched *that* page, and sent
 * both. The client picks up mid-view with no request at all.
 */
export const HydratedRestoredView: StoryObj = {
  render: () => {
    const { provider, records } = useLoggingProvider();
    const initialFilters: ActiveFilterEntry[] = [
      { filter: categoryFilter, state: { values: ["Igneous"] } },
    ];
    const initialSorts: ColumnSort[] = [{ key: "value", ascending: false }];
    // What the server would have computed for that view.
    const matching = ALL.filter((r) => r.category === "Igneous").sort(
      compareRowsBySorts(initialSorts),
    );
    return container([
      h(FetchLog, { key: "log", records }),
      h(DataPanel<Sample>, {
        key: "panel",
        provider,
        columnSpec,
        itemComponent: SampleCard,
        pageSize: PAGE_SIZE,
        name: "Samples",
        itemLabel: "sample",
        initialFilters,
        initialSorts,
        initialData: {
          rows: matching.slice(0, PAGE_SIZE),
          totalCount: matching.length,
        },
      }),
    ]);
  },
};
