import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { DataSheet, ChunkLoaderManager, ScrollToRowControl } from "../src";
import type { FetchChunkParams, TableFilter } from "../src";
import { FormGroup, NumericInput, SegmentedControl } from "@blueprintjs/core";
import { useState } from "react";
import "@blueprintjs/table/lib/css/table.css";

const h = hyper;

const meta: Meta<any> = {
  title: "Data sheet/Chunk loader",
  parameters: { layout: "fullscreen" },
};

export default meta;

// ---- A synthetic "server": 20k rows, paged, with sort + filter applied
// server-side (i.e. inside fetchChunk). ----

const categories = ["Igneous", "Metamorphic", "Sedimentary"];

const ALL_ROWS = Array.from({ length: 20000 }, (_, i) => ({
  id: i,
  name: `Sample ${i + 1}`,
  category: categories[i % categories.length],
  value: (i * 37) % 100,
}));

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function fetchChunk(params: FetchChunkParams) {
  const { offset, limit, sorts, filters, signal } = params;
  await sleep(250); // simulate network latency
  if (signal.aborted) return { rows: [], totalCount: 0 };

  let rows = ALL_ROWS.slice();

  // Apply filters (server-side) by column key
  for (const f of filters) {
    if (f.columnKey === "category" && f.state?.category != null) {
      rows = rows.filter((r) => r.category === f.state.category);
    }
    if (f.columnKey === "value" && f.state != null) {
      rows = rows.filter(
        (r) => r.value >= f.state.min && r.value <= f.state.max,
      );
    }
  }

  // Apply sorts (server-side), in priority order
  for (const s of [...sorts].reverse()) {
    rows.sort((a, b) => {
      const av = a[s.key];
      const bv = b[s.key];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return s.ascending ? cmp : -cmp;
    });
  }

  const totalCount = rows.length;
  return { rows: rows.slice(offset, offset + limit), totalCount };
}

const categoryFilter: TableFilter = {
  id: "category-filter",
  name: "Category",
  icon: "tag",
  columnKey: "category",
  defaultState: { category: "Igneous" },
  describeState: (s) => s?.category ?? null,
  filterForm({ state, setState }) {
    return h(
      FormGroup,
      { label: "Category" },
      h(SegmentedControl, {
        options: categories.map((c) => ({ label: c, value: c })),
        value: state?.category ?? "Igneous",
        onValueChange: (value) => setState({ ...state, category: value }),
      }),
    );
  },
  // Predicate unused here (filtering happens server-side in fetchChunk), but
  // required by the type.
  predicate: () => true,
};

const valueFilter: TableFilter<any, { min: number; max: number }> = {
  id: "value-filter",
  name: "Value",
  icon: "array-numeric",
  columnKey: "value",
  defaultState: { min: 0, max: 50 },
  describeState: (s) => `${s.min}–${s.max}`,
  filterForm({ state, setState }) {
    return h("div", { style: { display: "flex", gap: "8px" } }, [
      h(
        FormGroup,
        { label: "Min" },
        h(NumericInput, {
          value: state.min,
          onValueChange: (v) => setState({ ...state, min: v }),
          min: 0,
          max: 100,
          fill: true,
        }),
      ),
      h(
        FormGroup,
        { label: "Max" },
        h(NumericInput, {
          value: state.max,
          onValueChange: (v) => setState({ ...state, max: v }),
          min: 0,
          max: 100,
          fill: true,
        }),
      ),
    ]);
  },
  predicate: () => true,
};

// Rich, column-specific filters live on the column spec, so they appear as
// modal column-header filters (not just in the top bar).
const columnSpec = [
  { name: "ID", key: "id", width: 80, sortable: true },
  { name: "Name", key: "name", width: 200, sortable: true },
  {
    name: "Category",
    key: "category",
    width: 150,
    sortable: true,
    filters: [categoryFilter],
  },
  {
    name: "Value",
    key: "value",
    width: 100,
    sortable: true,
    filters: [valueFilter],
  },
];

/**
 * **The unified `fetchChunk` data source.**
 *
 * The sheet has no `data` — a `ChunkLoaderManager` drives loading through a
 * single `fetchChunk({ offset, limit, sorts, filters, signal })` function.
 * Scroll: it loads the chunk covering the first unloaded visible row and
 * pre-sizes the sheet from the returned `totalCount`. Sort a column or add a
 * filter: the view state flows into `fetchChunk` (applied "server-side" here),
 * and the loader re-fetches from scratch. The active filter tags show their
 * current window.
 */
export const ServerBackedTable: StoryObj = {
  render: () =>
    h(
      "div",
      {
        style: {
          padding: "2em",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        },
      },
      h(
        DataSheet,
        {
          data: [],
          columnSpec,
          editable: false,
          showLoadProgress: true,
        },
        [
          h(ScrollToRowControl, { key: "scroll-to-row" }),
          h(ChunkLoaderManager, { key: "loader", fetchChunk, pageSize: 100 }),
        ],
      ),
    ),
};

/**
 * **Switch modes and chunk size on the fly.** The same table flips between
 * scroll and paged via the `mode` prop (the loader resets and re-fetches), and
 * the tunable `chunkSize` is the window/page size. In paged mode the table
 * sizes to its rows (content height) rather than filling the viewport.
 */
function ModeToggleDemo() {
  const [mode, setMode] = useState<"scroll" | "paged">("scroll");
  const [chunkSize, setChunkSize] = useState(25);
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
    [
      h(
        "div",
        {
          style: {
            display: "flex",
            gap: "1.5em",
            alignItems: "center",
            marginBottom: "0.75em",
          },
        },
        [
          h(SegmentedControl, {
            small: true,
            options: [
              { label: "Scroll", value: "scroll" },
              { label: "Paged", value: "paged" },
            ],
            value: mode,
            onValueChange: (v) => setMode(v as "scroll" | "paged"),
          }),
          h(
            FormGroup,
            { label: "Chunk size", inline: true, style: { margin: 0 } },
            h(NumericInput, {
              value: chunkSize,
              onValueChange: (v) => setChunkSize(v || 1),
              min: 5,
              max: 500,
              stepSize: 5,
              style: { width: "5em" },
            }),
          ),
        ],
      ),
      h(
        "div",
        {
          style: {
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          },
        },
        h(
          DataSheet,
          {
            data: [],
            columnSpec,
            editable: false,
            showLoadProgress: true,
          },
          [
            h(ChunkLoaderManager, {
              key: "loader",
              fetchChunk,
              pageSize: chunkSize,
              fetchMode: mode,
            }),
          ],
        ),
      ),
    ],
  );
}

export const ModeToggle: StoryObj = {
  render: () => h(ModeToggleDemo),
};

/**
 * **Paged fetch mode** (`mode: "paged"`), a low-interaction fallback: one page
 * loads at a time (here 25 rows), with prev/next controls at the bottom
 * ("Page X of Y"). Sorting/filtering resets to page 1 and re-fetches. Note the
 * tunable `chunkSize` doubles as the page size.
 */
export const PagedTable: StoryObj = {
  render: () =>
    h(
      "div",
      {
        style: {
          padding: "2em",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        },
      },
      h(
        DataSheet,
        {
          data: [],
          columnSpec,
          editable: false,
          showLoadProgress: true,
        },
        [
          h(ChunkLoaderManager, {
            key: "loader",
            fetchChunk,
            pageSize: 25,
            fetchMode: "paged",
          }),
        ],
      ),
    ),
};

// ---- Unknown-total (append-on-scroll) source ----
//
// The predecessor to `ChunkLoaderManager` was a hand-rolled loader that
// appended a chunk of rows whenever the last visible row neared the end of the
// data array (via `onVisibleCellsChange`), with no notion of a total. That same
// shape is a `fetchChunk` that returns rows but **no `totalCount`**: in scroll
// mode the loader grows the sheet to `offset + rows.length` and keeps fetching
// as you scroll, until the source runs dry (an empty chunk).

const growingColumns = [
  { name: "ID", key: "id", width: 80 },
  { name: "Name", key: "name", width: 200 },
  { name: "Comments", key: "comments", width: 320 },
];

async function fetchGrowingChunk(params: FetchChunkParams) {
  const { offset, limit, signal } = params;
  await sleep(500); // simulate an on-demand append
  if (signal.aborted) return { rows: [] };
  // A large-but-finite source: rows are generated on the fly, and the source
  // runs dry at 5000 (an empty chunk stops the growth).
  const remaining = Math.max(0, 5000 - offset);
  const n = Math.min(limit, remaining);
  const rows = Array.from({ length: n }, (_, i) => {
    const id = offset + i + 1;
    return { id, name: `Item ${id}`, comments: `Comments for item ${id}` };
  });
  return { rows }; // no totalCount → append-on-scroll (grows as you go)
}

/**
 * **Append-on-scroll (unknown total).** The continuity case for the old
 * hand-rolled lazy loader: a `fetchChunk` that returns no `totalCount`, so the
 * sheet has no pre-sized scrollbar and simply grows a chunk at a time as you
 * scroll, until an empty chunk ends it. Same `ChunkLoaderManager`, just a
 * source that doesn't know its length up front.
 */
export const InfiniteScroll: StoryObj = {
  render: () =>
    h(
      "div",
      {
        style: {
          padding: "2em",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        },
      },
      h(
        DataSheet,
        {
          data: [],
          columnSpec: growingColumns,
          editable: false,
          showLoadProgress: true,
        },
        [
          h(ChunkLoaderManager, {
            key: "loader",
            fetchChunk: fetchGrowingChunk,
            pageSize: 100,
          }),
        ],
      ),
    ),
};
