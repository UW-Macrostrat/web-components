import {
  Button,
  InputGroup,
  OverlayToaster,
  Spinner,
  Tag as BPTag,
} from "@blueprintjs/core";
import h from "./main.module.sass";
import { DataSheet, getRowsToDelete } from "../core";
import { LithologyTag, Tag, TagSize } from "@macrostrat/data-components";
import {
  ColumnSortEntry,
  PostgrestColumnFilter,
  PostgrestFilter,
  PostgrestFilterOperator,
  PostgrestOrder,
  standardizeFilter,
  usePostgRESTLazyLoader,
} from "./data-loaders";
import { useCallback, useMemo, useState } from "react";
import {
  ErrorBoundary,
  ToasterContext,
  useToaster,
} from "@macrostrat/ui-components";
import { Spec } from "immutability-helper";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { ColorCell } from "../components";
import { DataSheetProviderProps } from "../types.ts";
import {
  type ColumnHeaderActions,
  ColumnHeaderRendererProps,
  OPERATOR_LABELS,
  renderPostgRESTColumnHeaderCell,
} from "../renderers";
import { atom } from "jotai";
import { columnSpecAtom, ctx } from "../provider.ts";
import { TableAction } from "../actions";
import { RegionCardinality } from "@blueprintjs/table";

export * from "./data-loaders";
export * from "./lazy-loader-table";

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
  ...rest
}: PostgRESTTableViewProps<T>) {
  // Boundary of Jotai store
  ctx.useSync(enableFullTextSearchAtom, enableFullTableSearch);

  // Server-side column sort/filter state
  const [columnSorts, setColumnSorts] = useState<ColumnSortEntry[]>([]);
  const [columnFilters, setColumnFilters] = useState<PostgrestColumnFilter[]>(
    [],
  );

  /** TODO: remove "full-text search" from filter options */
  const ftsFilter = buildFilter(ctx.useValue(fullTextSearchFilterConfigAtom));
  let filters = columnFilters.map(standardizeFilter);
  if (ftsFilter != null) {
    filters.push(ftsFilter);
  }

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

  const { data, onScroll, dispatch, getClient } = usePostgRESTLazyLoader(
    endpoint,
    table,
    {
      order: _order,
      columns,
      filters,
      identityKey: _identityKey,
    },
  );

  const toaster = useToaster();

  const finishResponse = useCallback(
    (promisedResult, changes) => {
      wrapWithErrorHandling(toaster, promisedResult).then((res) => {
        if (res == null) {
          throw new Error("Could not complete action");
        } else {
          // Merge new data with old data
          console.log("Updating data", changes);
          dispatch({ type: "update-data", changes });
        }
      });
    },
    [dispatch, toaster],
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

  if (data == null) {
    return h(Spinner);
  }

  const hasActiveFilters = columnFilters.length > 0;
  const hasActiveSort = columnSorts.length > 0;

  return h(
    DataSheet,
    {
      ...rest,
      dataSheetActions: enableFullTableSearch
        ? h(SearchAction)
        : dataSheetActions,
      data,
      columnSpecOptions: columnOptions,
      editable,
      onVisibleCellsChange: onScroll,
      columnHeaderCellRenderer,
      onDeleteRows(selection) {
        if (!editable) return;

        const rowIndices = getRowsToDelete(selection);

        const ids = rowIndices.map((i) => data[i][identityKey]);

        dispatch({ type: "start-loading" });

        const client = getClient();
        let query = client.delete().in(identityKey, ids);
        finishResponse(query, { $delete: Array.from(rowIndices.keys()) });
      },
      onSaveData(updates, data) {
        if (!editable) return;

        // Augment updates with primary key

        let changes: Spec<any[]> = {};
        let updateRows: any[] = [];
        for (let [key, update] of Object.entries(updates)) {
          const value = { ...data[key], ...update };
          updateRows.push(value);
          changes[key] = { $set: value };
        }

        dispatch({ type: "start-loading" });
        const client = getClient();
        // Save data
        let query = client.upsert(updateRows, { defaultToNull: false });
        finishResponse(query, changes);
      },
    },
    [
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

const saveDataAction: TableAction = {
  id: "save-data",
  name: "Save changes",
  icon: "floppy-disk",
  intent: "success",
  requiresEditable: true,
  targets: [RegionCardinality.FULL_TABLE],
  async run(ctx) {
    const data = ctx.data;
    const updates = ctx.updatedData;

    let changes: Spec<any[]> = {};
    let updateRows: any[] = [];
    for (let [key, update] of Object.entries(updates)) {
      const value = { ...data[key], ...update };
      updateRows.push(value);
      changes[key] = { $set: value };
    }

    dispatch({ type: "start-loading" });
    const client = getClient();
    // Save data
    let query = client.upsert(updateRows, { defaultToNull: false });
  },
};

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
        `${s.key}: ${s.ascending ? "A→Z" : "Z→A"}`,
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
