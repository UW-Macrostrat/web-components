import {
  Button,
  InputGroup,
  OverlayToaster,
  Tag as BPTag,
} from "@blueprintjs/core";
import h from "./main.module.sass";
import { DataSheet, getRowsToDelete } from "../core";
import { LithologyTag, Tag, TagSize } from "@macrostrat/data-components";
import {
  applyColumnFilters,
  ChunkLoaderManager,
  ColumnSortEntry,
  createPostgRESTFetchChunk,
  dataRefreshTokenAtom,
  PostgrestColumnFilter,
  PostgrestFilter,
  PostgrestFilterOperator,
  PostgrestOrder,
} from "./data-loaders";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ErrorBoundary,
  ToasterContext,
  useToaster,
} from "@macrostrat/ui-components";
import { PostgrestClient, PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { ColorCell, InfoBar } from "../components";
import { DataSheetProviderProps } from "../types.ts";
import {
  type ColumnHeaderActions,
  ColumnHeaderRendererProps,
  OPERATOR_LABELS,
  renderPostgRESTColumnHeaderCell,
} from "../renderers";
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

  // Server-side column sort/filter state (local; drives the fetchChunk query)
  const [columnSorts, setColumnSorts] = useState<ColumnSortEntry[]>([]);
  const [columnFilters, setColumnFilters] = useState<PostgrestColumnFilter[]>(
    [],
  );

  const ftsConfig = ctx.useValue(fullTextSearchFilterConfigAtom);

  const _order = [];
  if (typeof order === "object" && "key" in order) {
    _order.push(order);
  } else if (Array.isArray(order)) {
    _order.push(...order);
  }
  _order.push(...columnSorts);

  // Infer identity key
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

  // The base `filter` prop, active column filters, and full-text search applied
  // as one query transform, fed to the PostgREST fetchChunk (server-side).
  const baseFilter = useCallback(
    (q: PostgrestFilterBuilder<any, any, any, any>) => {
      let query = q;
      if (userFilter != null) query = userFilter(query as any) as any;
      query = applyColumnFilters(query, columnFilters);
      const ff = buildFilter(ftsConfig);
      if (ff != null) query = ff.apply(query);
      return query;
    },
    [userFilter, columnFilters, ftsConfig],
  );

  // A key over everything that changes the query. The fetchChunk is rebuilt and
  // the loader asked to re-fetch from scratch whenever it changes.
  const viewKey = JSON.stringify({
    o: _order,
    f: columnFilters,
    fts: ftsConfig,
    k: _identityKey,
  });

  const fetchChunk = useMemo(
    () =>
      createPostgRESTFetchChunk({
        endpoint,
        table,
        columns,
        identityKey: _identityKey,
        baseOrder: _order,
        baseFilter,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, table, columns, viewKey, baseFilter],
  );

  // Re-fetch when the query view changes (skip the initial mount — the loader
  // does its own first fetch).
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    bumpRefresh((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey]);

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

  // Column header actions for sort/filter
  const columnHeaderActions: ColumnHeaderActions = useMemo(
    () => ({
      onSetSort(key: string, ascending: boolean | null) {
        // Single-column sort: replace any existing sort
        if (ascending == null) {
          setColumnSorts([]);
        } else {
          setColumnSorts([{ key, ascending }]);
        }
      },
      onSetFilter(
        key: string,
        operator: PostgrestFilterOperator | null,
        value: string,
      ) {
        setColumnFilters((prev) => {
          const without = prev.filter((f) => f.key !== key);
          if (operator == null || value === "") return without;
          return [...without, { key, operator, value }];
        });
      },
      onClearColumn(key: string) {
        setColumnSorts((prev) => prev.filter((s) => s.key !== key));
        setColumnFilters((prev) => prev.filter((f) => f.key !== key));
      },
    }),
    [],
  );

  // Column header cell renderer using sort/filter state
  const columnHeaderCellRenderer = useCallback(
    (props: ColumnHeaderRendererProps) => {
      const { col, colIndex } = props;
      const activeSort = columnSorts.find((s) => s.key === col.key);
      const activeFilter = columnFilters.find((f) => f.key === col.key);
      return renderPostgRESTColumnHeaderCell({
        col,
        colIndex,
        activeSort,
        activeFilter,
        actions: columnHeaderActions,
      });
    },
    [columnSorts, columnFilters, columnHeaderActions],
  );

  const hasActiveFilters = columnFilters.length > 0;
  const hasActiveSort = columnSorts.length > 0;

  return h(
    DataSheet,
    {
      ...rest,
      dataSheetActions: enableFullTableSearch
        ? h(SearchAction)
        : dataSheetActions,
      columnSpecOptions: columnOptions,
      editable,
      onSave: editable ? handleSave : undefined,
      columnHeaderCellRenderer,
      onDeleteRows(selection) {
        if (!editable) return;

        const rowIndices = getRowsToDelete(selection);
        const ids = rowIndices.map((i) => data[i]?.[_identityKey]);
        const query = getClient().delete().in(_identityKey, ids);
        wrapWithErrorHandling(toaster, query).then((res) => {
          if (res != null) bumpRefresh((v) => v + 1);
        });
      },
    },
    [
      h(ChunkLoaderManager, { key: "loader", fetchChunk }),
      h.if(hasActiveFilters || hasActiveSort)(ServerFilterBar, {
        columnSorts,
        columnFilters,
        onClearFilter(key: string) {
          columnHeaderActions.onClearColumn(key);
        },
        onClearAll() {
          setColumnSorts([]);
          setColumnFilters([]);
        },
      }),
    ],
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

/** Bar showing active server-side sort and filter state as removable tags. */
function ServerFilterBar({
  columnSorts,
  columnFilters,
  onClearFilter,
  onClearAll,
}: {
  columnSorts: ColumnSortEntry[];
  columnFilters: PostgrestColumnFilter[];
  onClearFilter: (key: string) => void;
  onClearAll: () => void;
}) {
  return h("div.server-filter-bar", [
    columnSorts.map((s) =>
      h(
        BPTag,
        {
          key: `sort-${s.key}`,
          icon: s.ascending ? "sort-asc" : "sort-desc",
          intent: "primary",
          onRemove: () => onClearFilter(s.key),
          minimal: true,
        },
        `${s.key}: ${s.ascending ? "Ascending" : "Descending"}`,
      ),
    ),
    columnFilters.map((f) =>
      h(
        BPTag,
        {
          key: `filter-${f.key}`,
          icon: "filter",
          intent: "warning",
          onRemove: () => onClearFilter(f.key),
          minimal: true,
        },
        `${f.key} ${OPERATOR_LABELS[f.operator] ?? f.operator} ${f.value}`,
      ),
    ),
    h(
      Button,
      {
        minimal: true,
        small: true,
        icon: "cross",
        onClick: onClearAll,
      },
      "Clear all",
    ),
  ]);
}
