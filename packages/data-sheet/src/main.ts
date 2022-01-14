import { DataSheetProvider } from "./provider";
import { VirtualizedSheet } from "./virtualized";
import h from "@macrostrat/hyper";

export function DataSheetMain({ columns, ...rest }) {
  return h(DataSheetProvider, { columns }, h(VirtualizedSheet, rest));
}
