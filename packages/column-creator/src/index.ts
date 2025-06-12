import {
  ColumnCreatorProvider,
  useColumnCreatorStore,
  useSelector,
} from "./store";
import { ColorCell, ColorPicker, DataSheet } from "@macrostrat/data-sheet";

export * from "./store";
import { FlexRow, ToasterContext, useToaster } from "@macrostrat/ui-components";
import { BasicUnitComponent, Column } from "@macrostrat/column-views";
import h from "@macrostrat/hyper";
import { asChromaColor } from "@macrostrat/color-utils";
import { Radio, RadioGroup } from "@blueprintjs/core";

export function ColumnCreator({ initialUnits }) {
  return h(
    ToasterContext,
    h(
      ColumnCreatorProvider,
      { initialState: { units: initialUnits } },
      h("div.column-creator-test", [
        h(FlexRow, { gap: "1em" }, [
          h(ColumnCreatorColumn),
          h(ColumnCreatorDataEditor),
        ]),
      ])
    )
  );
}

function ColumnCreatorColumn() {
  const units = useSelector((state) => state.extUnits);
  const axisType = useSelector((state) => state.info.axisType);

  return h(Column, {
    units,
    axisType,
    pixelScale: 0.8,
    allowUnitSelection: true,
    unitComponent: BasicUnitComponent,
  });
}

function ColumnCreatorDataEditor() {
  return h("div.column-creator-data-editor", [
    h(ColumnBasicElementsEditor),
    h(ColumnCreatorUnitsEditor),
  ]);
}

function ColumnCreatorSurfacesEditor() {
  const surfaces = useSelector((state) => state.surfaces);
  const setSurfaces = useSelector((state) => state.setSurfaces);

  return h(DataSheet, {
    data: surfaces,
    columnSpec: [
      {
        name: "Surface Name",
        key: "name",
        required: true,
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
      let newData = new Array(updatedData.length);

      for (let i = 0; i < updatedData.length; i++) {
        const d = updatedData[i];
        let newRow: object = (data[i] as object) ?? {};
        if (d != null) {
          newRow = { ...newRow, ...d };
        }
        newData[i] = newRow;
      }
      setSurfaces(newData);
    },
  });
}

function ColumnCreatorUnitsEditor() {
  const units = useSelector((state) => state.units);
  const store = useColumnCreatorStore();
  const setUnits = useSelector((state) => state.setUnits);
  const toaster = useToaster();

  // Sort units by their bottom position

  return h(DataSheet, {
    data: units,
    columnSpec: [
      {
        name: "Bottom",
        key: "b_pos",
        required: true,
      },
      {
        name: "Top",
        key: "t_pos",
      },
      { name: "Unit Name", key: "unit_name" },

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
      {
        name: "Pattern",
        key: "patternID",
      },
    ],
    onUpdateData: (updatedData, data) => {
      // Update the units in the store

      let newData = Array(Math.max(updatedData.length, data.length));

      for (let i = 0; i < newData.length; i++) {
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

function ColumnBasicElementsEditor() {
  const info = useSelector((state) => state.info);
  const updateInfo = useSelector((state) => state.updateInfo);

  return h("div.column-basic-elements-editor", [
    h(
      RadioGroup,
      {
        label: "Axis type",
        inline: true,
        selectedValue: info.axisType,
        onChange(evt) {
          updateInfo({ axisType: { $set: evt.target.value } });
        },
      },
      [
        h(Radio, {
          label: "Height",
          value: "height",
        }),
        h(Radio, {
          label: "Age",
          value: "age",
        }),
      ]
    ),
  ]);
}
