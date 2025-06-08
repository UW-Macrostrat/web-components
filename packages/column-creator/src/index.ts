import {
  ColumnCreatorProvider,
  useColumnCreatorStore,
  useSelector,
} from "./store";
import { ColorCell, ColorPicker, DataSheet } from "@macrostrat/data-sheet";

export * from "./store";
import { FlexRow } from "@macrostrat/ui-components";
import { BasicUnitComponent, Column } from "@macrostrat/column-views";
import h from "@macrostrat/hyper";
import { asChromaColor } from "@macrostrat/color-utils";
import update from "immutability-helper";

export function ColumnCreator({ initialUnits }) {
  return h(
    ColumnCreatorProvider,
    { initialState: { units: initialUnits } },
    h(FlexRow, { gap: "1em" }, [h(ColumnCreatorColumn), h(ColumnCreatorData)])
  );
}

function ColumnCreatorColumn() {
  const units = useSelector((state) => state.extUnits);
  const axisType = useSelector((state) => state.axisType);

  return h(Column, {
    units,
    axisType,
    pixelScale: 0.8,
    allowUnitSelection: true,
    unitComponent: BasicUnitComponent,
  });
}

function ColumnCreatorData() {
  const units = useSelector((state) => state.units);
  const store = useColumnCreatorStore();
  const setUnits = useSelector((state) => state.setUnits);

  // Sort units by their bottom position

  return h(DataSheet, {
    data: units,
    columnSpec: [
      { name: "Unit Name", key: "unit_name" },
      {
        name: "Bottom",
        key: "b_pos",
        required: true,
      },
      {
        name: "Top",
        key: "t_pos",
      },
      {
        name: "Color",
        key: "color",
        required: false,
        isValid: (d) => asChromaColor(d) != null,
        transform: (d) => d,
        dataEditor: ColorPicker,
        valueRenderer: (d) => {
          const color = asChromaColor(d);
          return color?.name() ?? "";
        },
        cellComponent: ColorCell,
      },
    ],
    onUpdateData: (updatedData, data) => {
      // Update the units in the store

      let newData = Array(updatedData.length);

      for (let i = 0; i < updatedData.length; i++) {
        const d = updatedData[i];
        let newRow: object = (data[i] as object) ?? {};
        if (d != null) {
          newRow = { ...newRow, ...d };
        }
        newData[i] = newRow;
      }
      setUnits(newData);
    },
  });
}
