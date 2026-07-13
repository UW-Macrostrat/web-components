import {
  ColumnSpec,
  createLocalProvider,
  FetchDataParams,
  FetchDataResult,
  ItemComponentProps,
  TableAction,
  TableDataProvider,
} from "../../src";
import { RegionCardinality } from "@blueprintjs/table";
import h from "@macrostrat/hyper";
import { SegmentedControl, Tag } from "@blueprintjs/core";
import { CSSProperties } from "react";

export interface Sample {
  id: number;
  name: string;
  category: string;
  status: string;
  value: number;
  tags: string[];
}

export const CATEGORIES = ["Igneous", "Metamorphic", "Sedimentary"];
export const STATUSES = ["active", "draft", "archived"];
export const TAG_PALETTE = ["priority", "review", "blocked", "verified"];
export const CATEGORY_INTENT: Record<string, any> = {
  Igneous: "danger",
  Metamorphic: "primary",
  Sedimentary: "success",
};
export const ALL: Sample[] = Array.from({ length: 150 }, (_, i) => ({
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
export async function fetchSamples(
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

export const fullSpec: ColumnSpec[] = [
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
// A mutable in-memory source with `saveRows` — the data side of the edit. The
// panel wires `saveRows` (+ auto-refresh) onto the action context, so the
// actions above stay generic. (A real page would persist to the API here.)
export function makeEditableProvider(): TableDataProvider<Sample> {
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

export const addTagAction = editTagAction(
  "add-tag",
  "Add tag",
  "tag",
  (tags, tag) => [...new Set([...tags, tag])],
);
export const removeTagAction = editTagAction(
  "remove-tag",
  "Remove tag",
  "cross",
  (tags, tag) => tags.filter((t) => t !== tag),
);
export const container = (child: any) =>
  h(
    "div",
    {
      style: {
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      },
    },
    child,
  );
export const cardStyle = (selected: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 10px",
  border: "1px solid rgba(128,128,128,0.25)",
  borderRadius: "4px",
  background: selected ? "rgba(45,114,210,0.12)" : "rgba(128,128,128,0.04)",
});

export function SampleCard({
  data,
  selected,
  onSelect,
}: ItemComponentProps<Sample>) {
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
const TAG_INTENT: Record<string, any> = {
  priority: "danger",
  review: "warning",
  blocked: "none",
  verified: "success",
};

export function TaggedCard({
  data,
  selected,
  onSelect,
}: ItemComponentProps<Sample>) {
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
