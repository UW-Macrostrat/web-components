/**
 * DataView — a single data source rendered as either the cell grid
 * (`_DataSheet`) or the card list (`_DataPanel`), sharing **one** store.
 *
 * Both renderers are already "inner" components that read the shared jotai +
 * zustand store rather than creating it; `DataView` mounts one
 * `DataSheetProvider` and swaps which renderer sits inside it. Because the store
 * (selection, sorts, filters, loaded data, edit overlay) persists across the
 * swap, toggling `view` keeps the user's view state — the realized "one data +
 * behavior definition, two presentations". The data source is resolved once via
 * the shared `useResolvedProvider`, and the same `columnSpec` / `actions` /
 * `filters` drive whichever renderer is mounted.
 */
import h from "@macrostrat/hyper";
import { ReactNode } from "react";
import {
  DataSheetProvider,
  DataViewRendererType,
  splitDataProviderProps,
} from "./provider";
import { DataSheetRenderer } from "./data-sheet.ts";
import { DataPanelProps, DataPanelRenderer } from "./data-panel.ts";

export interface DataViewProps<T = any> extends DataPanelProps<T> {
  /** Which renderer to show. `cards` needs `itemComponent`. */
  viewType: DataViewRendererType;
  /** Passed to the table renderer (ignored by cards). Defaults to `true`. */
  editable?: boolean;
}

export function DataView<T>(props: DataViewProps<T>) {
  const [providerProps, rendererProps] = splitDataProviderProps(props);
  const { viewType, editable } = providerProps;

  const {
    // `data` is only the source for the resolved provider (below); renderers
    // read live rows from the store, so it's kept out of `common`.
    // Card-only props — kept off the table renderer so they don't leak onto
    // the Blueprint table.
    itemComponent,
    toolbar,
    sidebar,
    contentFooter,
    autoLoadPages,
    scrollBody,
    // The rest (provider/fetchData/identity/actions/filters/pageSize/
    // name/statusBar/refreshToken) is common to both renderers.
    ...common
  } = rendererProps as DataPanelProps<T>;

  let renderer: ReactNode;
  if (viewType === "cards") {
    renderer = h(DataPanelRenderer<any>, {
      ...common,
      itemComponent,
      toolbar,
      sidebar,
      contentFooter,
      autoLoadPages,
      scrollBody,
    });
  } else {
    renderer = h(DataSheetRenderer<any>, {
      ...common,
      editable,
    });
  }

  return h(DataSheetProvider<T>, providerProps, renderer);
}
