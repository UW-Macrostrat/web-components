export * from "./store";
import { FlexRow } from "@macrostrat/ui-components";
import { BasicUnitComponent, Column } from "@macrostrat/column-views";
import { ColumnAxisType } from "@macrostrat/column-components";
import h from "@macrostrat/hyper";

export function ColumnCreator({ initialUnits }) {
  return h(FlexRow, { gap: "1em" }, [
    h(Column, {
      units: initialUnits,
      axisType: ColumnAxisType.HEIGHT,
      pixelScale: 0.8,
      allowUnitSelection: true,
      unitComponent: BasicUnitComponent,
    }),
  ]);
}
