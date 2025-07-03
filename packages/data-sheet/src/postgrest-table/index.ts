import { Toaster, HotkeysProvider } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import { DataSheet, getRowsToDelete } from "../core"; //getRowsToDelete
import { LithologyTag, Tag, TagSize } from "@macrostrat/data-components";
import { PostgrestOrder, usePostgRESTLazyLoader } from "./data-loaders";
import { Spinner, InputGroup } from "@blueprintjs/core";

export * from "./data-loaders";
import { useCallback, useState, useRef } from "react";
import {
  ErrorBoundary,
  ToasterContext,
  useToaster,
} from "@macrostrat/ui-components";
import { Spec } from "immutability-helper";
import { DataSheetProviderProps } from "../provider";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import type {
  GenericFunction,
  GenericTable,
  GenericView,
} from "@supabase/postgrest-js/dist/cjs/types";
import { ColorCell } from "../components";

const h = hyper.styled(styles);

export type GenericSchema = {
  Tables: Record<string, GenericTable>;
  Views: Record<string, GenericView>;
  Functions: Record<string, GenericFunction>;
};

interface PostgRESTTableViewProps<T extends object>
  extends DataSheetProviderProps<T> {
  endpoint: string;
  table: string;
  columnOptions?: any;
  order?: PostgrestOrder<T>;
  columns?: string;
  editable?: boolean;
  identityKey?: string;
  enableFullTableSearch?: boolean;
  dataSheetActions?: any; 
  filter(
    query: PostgrestFilterBuilder<T, any, any>,
  ): PostgrestFilterBuilder<T, any, any>;
}

export function PostgRESTTableView<T>(props: PostgRESTTableViewProps<T>) {
  return h(
    ErrorBoundary,
    h(HotkeysProvider, h(ToasterContext, h(_PostgRESTTableView, props))),
  );
}

const successResponses = [200, 201];

function _PostgRESTTableView<T>({
  endpoint,
  table,
  columnOptions,
  order,
  columns,
  editable = false,
  filter = undefined,
  enableFullTableSearch = false,
  dataSheetActions,
  identityKey = "id",
  ...rest
}: PostgRESTTableViewProps<T>) {
  const [input, setInput] = useState("");

  filter = (query) => {
    const urlParams = new URLSearchParams(query.url.search);
    urlParams.delete("name");
    query.url.search = urlParams.toString() ? `?${urlParams.toString()}` : "";

    if (input.length > 2 && enableFullTableSearch) {
      return query.ilike("name", `*${input}*`);
    }

    return query;
  };


  const { data, onScroll, dispatch, client } = usePostgRESTLazyLoader(
    endpoint,
    table,
    {
      order: order ?? { key: identityKey, ascending: true },
      columns,
      filter,   
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

  if (data == null) {
    return h(Spinner);
  }

  return h("div.data-sheet-outer", [
    h(DataSheet, {
      ...rest,
      dataSheetActions: enableFullTableSearch ? h(SearchAction, { input, setInput, dispatch }) : dataSheetActions,
      data,
      columnSpecOptions: columnOptions ?? {},
      editable,
      onVisibleCellsChange: onScroll,
      onDeleteRows(selection) {
        if (!editable) return;

        const rowIndices = getRowsToDelete(selection);

        const ids = rowIndices.map((i) => data[i][identityKey]);

        dispatch({ type: "start-loading" });

        let query = client.delete().in(identityKey, ids);

        query = filter?.(query) ?? query;

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

        // Save data
        let query = client.upsert(updateRows, { defaultToNull: false });

        query = filter?.(query) ?? query;

        finishResponse(query, changes);
      },
    }),
  ]);
}

export function notifyOnError(toaster: Toaster, error: any) {
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
      h.if(status != null)([h("code.bp5-code", status), " "]),
      h.if(code != null)([h("code.bp5-code", code), " "]),
      message ?? "An error occurred",
      errorDetails,
    ]),
    intent: "danger",
  });
}

export function wrapWithErrorHandling<T = any>(
  toaster: Toaster,
  fnPromise: Promise<T>,
): Promise<T | null> {
  return fnPromise
    .then((p) => {
      if (p.error != null) {
        // Rethrow error
        throw p.error;
      }
      return p;
    })
    .catch((err) => {
      notifyOnError(toaster, err);
      return null;
    });
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

export function SearchAction({ input, setInput, dispatch }) {
  return h(InputGroup, {
    type: "search",
    placeholder: "Search table...",
    value: input,
    onChange(event) {
      const search = event.target.value;
      if(search.length > 2 || (input.length === 3 && search.length < 3)) {
        dispatch({ type: 'reset' })
      }
      setInput(search.toLowerCase());
    },
  });
}