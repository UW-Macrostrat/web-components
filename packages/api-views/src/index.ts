import h from "@macrostrat/hyper";
import { ColumnProvider, ColumnAxisType } from "@macrostrat/column-components";

export function MacrostratColumnProvider(props) {
  // A column provider specialized the Macrostrat API
  return h(ColumnProvider, { axisType: ColumnAxisType.AGE, ...props });
}

export * from "./context";
