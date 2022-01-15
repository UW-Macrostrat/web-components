import { DataSheetProvider } from "./provider";
import { VirtualizedSheet, BaseSheet } from "./virtualized";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { enhanceData } from "./enhancers";
import { GridElement } from "./base";
import h from "@macrostrat/hyper";

function transformData(columns, data: object): GridElement[] {
  const row1 = columns.map((d) => {
    return { value: data[d.key] ?? null, className: "test" };
  });
  return enhanceData(row1, columns);
}

export function DataSheet({ columns, data, virtualized = false, ...rest }) {
  const component = virtualized ? VirtualizedSheet : BaseSheet;
  const newData = data.map((d) => transformData(columns, d));

  return h(
    ErrorBoundary,
    null,
    h(DataSheetProvider, { columns }, h(component, { ...rest, data: newData }))
  );
}
