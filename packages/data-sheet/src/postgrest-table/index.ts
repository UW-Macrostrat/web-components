import { OverlayToaster, Tag, Toaster } from "@blueprintjs/core";
import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import { DataSheet, ColorCell } from "../core"; //getRowsToDelete
import { LithologyTag } from "./cell-renderers";
import { usePostgRESTLazyLoader } from "./data-loaders";
import { Spinner } from "@blueprintjs/core";

export * from "./data-loaders";
import { useCallback, useRef } from "react";
import {
  ErrorBoundary,
  ToasterContext,
  useToaster,
} from "@macrostrat/ui-components";
import { Spec } from "immutability-helper";
import { DataSheetProviderProps } from "../provider";

const h = hyper.styled(styles);

interface PostgRESTTableViewProps<T> extends DataSheetProviderProps<T> {
  endpoint: string;
  table: string;
  columnOptions?: any;
  order?: any;
  columns?: string;
  editable?: boolean;
}

export function PostgRESTTableView<T>(props: PostgRESTTableViewProps<T>) {
  return h(ErrorBoundary, h(ToasterContext, h(_PostgRESTTableView, props)));
}

const successResponses = [200, 201];

function _PostgRESTTableView<T>({
  endpoint,
  table,
  columnOptions,
  order,
  columns,
  editable = false,
  ...rest
}: PostgRESTTableViewProps<T>) {
  const { data, onScroll, dispatch, client } = usePostgRESTLazyLoader(
    endpoint,
    table,
    {
      order,
      columns,
    }
  );

  const toaster = useToaster();

  const finishResponse = useCallback(
    (promisedResult, changes) => {
      wrapWithErrorHandling(toaster, promisedResult).then((res) => {
        if (res == null) {
          return;
        }
        // Merge new data with old data
        dispatch({ type: "update-data", changes });
      });
    },
    [dispatch]
  );

  if (data == null) {
    return h(Spinner);
  }

  return h("div.data-sheet-outer", [
    h(DataSheet, {
      ...rest,
      data,
      columnSpecOptions: columnOptions ?? {},
      editable,
      onVisibleCellsChange: onScroll,
      onDeleteRows(selection) {
        if (!editable) return;

        const rowIndices = console.log(rowIndices); //getRowsToDelete(selection);

        const ids = rowIndices.map((i) => data[i].id);

        dispatch({ type: "start-loading" });

        const query = client.delete().in("id", ids);

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
        const query = client.upsert(updateRows, { defaultToNull: false });

        finishResponse(query, changes);
      },
    }),
  ]);
}

export function notifyOnError(toaster: Toaster, error: any) {
  console.error(error);
  const { message, status, code } = error;
  toaster.show({
    message: h([
      h.if(status != null)([h("code.bp5-code", status), " "]),
      h.if(code != null)([h("code.bp5-code", code), " "]),
      message,
    ]),
    intent: "danger",
  });
}

export function wrapWithErrorHandling<T = any>(
  toaster: Toaster,
  fnPromise: Promise<T>
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
  return h("span.liths", [
    addJoiner(value?.map((d) => h(LithologyTag, { data: d }))),
  ]);
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
                return h(Tag, { minimal: true, key: d }, [
                  h("span.tag-header", "Column"),
                  " ",
                  h("code", d),
                ]);
              })
            ),
          ]);
        })
      ),
    ]),
  ]);
}

function addJoiner(arr) {
  return arr?.reduce((acc, curr) => [acc, " ", curr]);
}
