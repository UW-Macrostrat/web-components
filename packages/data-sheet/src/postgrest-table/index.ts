import { InputGroup, OverlayToaster } from "@blueprintjs/core";
import h from "./main.module.sass";
import { DataSheet, getRowsToDelete } from "../core";
import { LithologyTag, Tag, TagSize } from "@macrostrat/data-components";
import {
  ChunkLoaderManager,
  createPostgRESTFetchChunk,
  dataRefreshTokenAtom,
  PostgrestFilter,
  PostgrestOrder,
} from "./data-loaders";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ErrorBoundary,
  ToasterContext,
  useToaster,
} from "@macrostrat/ui-components";
import { PostgrestClient, PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { ColorCell, InfoBar } from "../components";
import { DataSheetProviderProps } from "../types.ts";
import { atom } from "jotai";
import { columnSpecAtom, ctx, tableDataAtom } from "../provider.ts";

export * from "./data-loaders";

interface PostgRESTTableViewProps<
  T extends object,
> extends DataSheetProviderProps<T> {
  endpoint: string;
  table: string;
  columnOptions?: any;
  order?: PostgrestOrder<T> | PostgrestOrder<any>[];
  columns?: string;
  editable?: boolean;
  identityKey?: string;
  enableFullTableSearch?: boolean;
  dataSheetActions?: any;
  filter(
    query: PostgrestFilterBuilder<T, any, any, any>,
  ): PostgrestFilterBuilder<T, any, any, any>;
}

export function PostgRESTTableView<T>(props: PostgRESTTableViewProps<T>) {
  return h(
    ErrorBoundary,
    h(ctx.Provider, h(ToasterContext, h(_PostgRESTTableView, props))),
  );
}

const successResponses = [200, 201];

const enableFullTextSearchAtom = atom(false);

const fullTextSearchInputAtom = atom("");

interface FtsFilterConfig {
  text: string;
  columns: string[];
}

const fullTextSearchFilterConfigAtom = atom<FtsFilterConfig | null>((get) => {
  const enable = get(enableFullTextSearchAtom);
  const searchText = get(fullTextSearchInputAtom).toLowerCase();
  console.log("Full text search", enable, searchText);
  if (!enable || searchText.length < 3) return null;
  const columnSpec = get(columnSpecAtom);

  const columns = columnSpec
    .filter((d) => d.dataType == "text")
    .map((d) => d.key);

  return {
    text: searchText,
    columns,
  } as FtsFilterConfig;
});

function buildFilter(cfg: FtsFilterConfig | null): PostgrestFilter | null {
  if (cfg == null) return null;
  return {
    type: "filter",
    id: `fts-${cfg.text}`,
    apply(res) {
      const _filters = cfg.columns.map((d) => `${d}.ilike.*${cfg.text}*`);
      const filters = _filters.join(",");
      return res.or(filters);
    },
  };
}

function _PostgRESTTableView<T>({
  endpoint,
  table,
  columnOptions,
  order,
  columns,
  editable = false,
  enableFullTableSearch = false,
  dataSheetActions,
  identityKey = null,
  filter: userFilter,
  ...rest
}: PostgRESTTableViewProps<T>) {
  // Boundary of Jotai store
  ctx.useSync(enableFullTextSearchAtom, enableFullTableSearch);

  const ftsConfig = ctx.useValue(fullTextSearchFilterConfigAtom);

  // Base ordering from the `order` prop (active column sorts are added by the
  // fetchChunk from the shared store, per-column identity appended last).
  const _order: PostgrestOrder<any>[] = [];
  if (typeof order === "object" && "key" in order) {
    _order.push(order as PostgrestOrder<any>);
  } else if (Array.isArray(order)) {
    _order.push(...order);
  }

  // Infer identity key from the order prop when not given explicitly.
  let _identityKey = identityKey;
  if (_identityKey == null) {
    if (_order.length == 0) {
      throw "Must specify identity key or order by column";
    } else {
      _identityKey = _order[0].key;
    }
  }

  const toaster = useToaster();
  const bumpRefresh = ctx.useSet(dataRefreshTokenAtom);
  const getClient = useCallback(
    () => new PostgrestClient(endpoint).from(table),
    [endpoint, table],
  );
  // Loaded rows (the chunk loader writes these into the shared store) — used to
  // resolve selected row indices to identity keys when deleting.
  const data = ctx.useValue(tableDataAtom);

  // Base query transform: the `filter` prop + full-text search. Column filters
  // come from the shared store (as operator `columnFilter`s) via the loader's
  // `params.filters`, so they aren't applied here.
  const baseFilter = useCallback(
    (q: PostgrestFilterBuilder<any, any, any, any>) => {
      let query = q;
      if (userFilter != null) query = userFilter(query as any) as any;
      const ff = buildFilter(ftsConfig);
      if (ff != null) query = ff.apply(query);
      return query;
    },
    [userFilter, ftsConfig],
  );

  const orderKey = JSON.stringify(_order);
  const fetchChunk = useMemo(
    () =>
      createPostgRESTFetchChunk({
        endpoint,
        table,
        columns,
        identityKey: _identityKey!,
        baseOrder: _order,
        baseFilter,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, table, columns, _identityKey, orderKey, baseFilter],
  );

  // Full-text search re-runs the query; the loader re-fetches on store
  // sort/filter changes on its own, so only FTS needs a nudge here.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    bumpRefresh((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ftsConfig]);

  // Save: upsert the edited rows, then re-fetch. Wired to the built-in Save
  // action via the DataSheet `onSave` prop (present only when editable).
  const handleSave = useCallback(
    async (actionCtx: any) => {
      const base = actionCtx.data ?? [];
      const updates = actionCtx.updatedData ?? [];
      const updateRows: any[] = [];
      for (const [key, upd] of Object.entries(updates)) {
        if (upd == null || Object.keys(upd).length === 0) continue;
        updateRows.push({ ...base[key], ...(upd as object) });
      }
      if (updateRows.length === 0) return;
      const query = getClient().upsert(updateRows, { defaultToNull: false });
      const res = await wrapWithErrorHandling(toaster, query);
      if (res != null) bumpRefresh((v) => v + 1);
    },
    [getClient, toaster, bumpRefresh],
  );

  return h(
    DataSheet,
    {
      ...rest,
      dataSheetActions: enableFullTableSearch
        ? h(SearchAction)
        : dataSheetActions,
      columnSpecOptions: columnOptions,
      editable,
      // Row identity for the edit overlay, so edits survive a re-ordered
      // re-fetch (the server returns re-ordered windows on sort/filter).
      identity: (row: any) => row?.[_identityKey!],
      onSave: editable ? handleSave : undefined,
      // Sort/filter now use the generic store-driven column header + FilterBar
      // (columns are auto-inferred `sortable`/`filterable`); no PostgREST-only
      // header or bar.
      onDeleteRows(selection) {
        if (!editable) return;

        const rowIndices = getRowsToDelete(selection);
        const ids = rowIndices.map((i) => data[i]?.[_identityKey!]);
        const query = getClient().delete().in(_identityKey!, ids);
        wrapWithErrorHandling(toaster, query).then((res) => {
          if (res != null) bumpRefresh((v) => v + 1);
        });
      },
    },
    [h(ChunkLoaderManager, { key: "loader", fetchChunk })],
  );
}

export function notifyOnError(toaster: OverlayToaster, error: any) {
  console.error(error);
  const { message, status, code, details } = error;

  let errorDetails = null;

  if (details != null) {
    if (typeof details === "string") {
      errorDetails = h("p.error-details", details);
    } else {
      errorDetails = h("div.error-details", [
        h("h4", "Error details"),
        h("pre", JSON.stringify(details, null, 2)),
      ]);
    }
  }

  toaster.show({
    message: h([
      h.if(status != null)([h("code.bp6-code", status), " "]),
      h.if(code != null)([h("code.bp6-code", code), " "]),
      message ?? "An error occurred",
      errorDetails,
    ]),
    intent: "danger",
  });
}

interface PromiseResult {
  error?: Error;
}

export async function wrapWithErrorHandling<T extends PromiseResult>(
  toaster: OverlayToaster,
  fnPromise: Promise<T>,
): Promise<T | null> {
  try {
    const p = await fnPromise;
    if (p.error != null) {
      // Rethrow error
      throw p.error;
    }
    return p;
  } catch (err) {
    notifyOnError(toaster, err);
    return null;
  }
}

export function LongTextViewer({ value, onChange }) {
  return h("div.long-text", value);
}

export function IntervalCell({ value, children, ...rest }) {
  return h(ColorCell, { value: value?.color, ...rest }, value?.name);
}

export function lithologyRenderer(value) {
  return h(
    "span.tag-cell-content.liths",
    value?.map((d) => h(LithologyTag, { data: d, key: d.id })),
  );
}

export function ExpandedLithologies({ value, onChange }) {
  if (value == null) return h("div.basis-panel", "No lithologies");
  return h("div.basis-panel", [
    h("table", [
      h("thead", h("tr", [h("th", "Lithology"), h("th", "Source")])),
      h(
        "tbody",
        value.map((d) => {
          return h("tr", { key: d.id }, [
            h("td", h(LithologyTag, { data: d })),
            h(
              "td.basis-col",
              d.basis_col?.map((d) => {
                return h(Tag, {
                  size: TagSize.Small,
                  key: d,
                  name: h([h("span.tag-header", "Column"), " ", h("code", d)]),
                });
              }),
            ),
          ]);
        }),
      ),
    ]),
  ]);
}

export function SearchAction() {
  const [input, setInput] = ctx.use(fullTextSearchInputAtom);
  return h(InputGroup, {
    type: "search",
    placeholder: "Search table...",
    value: input,
    onChange(event) {
      setInput(event.target.value);
    },
  });
}

