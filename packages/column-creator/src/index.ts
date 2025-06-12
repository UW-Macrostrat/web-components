import {
  ColumnCreatorData,
  ColumnCreatorProvider,
  useColumnCreatorStore,
  useSelector,
} from "./store";
import { ColorCell, ColorPicker, DataSheet } from "@macrostrat/data-sheet";

export * from "./store";
import { FlexRow, ToasterContext, useToaster } from "@macrostrat/ui-components";
import { BasicUnitComponent, Column } from "@macrostrat/column-views";
import hyper from "@macrostrat/hyper";
import { asChromaColor } from "@macrostrat/color-utils";
import { Radio, RadioGroup, SegmentedControl } from "@blueprintjs/core";
import { useState } from "react";

import styles from "./index.module.sass";
import Box from "ui-box";

const h = hyper.styled(styles);

export function ColumnCreator({ data }: { data: ColumnCreatorData }) {
  return h(
    ToasterContext,
    h(
      ColumnCreatorProvider,
      { initialData: data },
      h("div.column-creator-test", [
        h(FlexRow, { gap: "2em" }, [
          h(ColumnCreatorColumn),
          h(ColumnCreatorDataEditor),
        ]),
      ])
    )
  );
}

function ColumnCreatorColumn() {
  const units = useSelector((state) => state.realizedUnits);
  const axisType = useSelector((state) => state.info.axisType);

  return h(Column, {
    units: units.filter((u) => u.errors.length == 0),
    axisType,
    pixelScale: 0.8,
    allowUnitSelection: false,
    unitComponent: BasicUnitComponent,
  });
}

enum EditingType {
  SURFACES = "surfaces",
  UNITS = "units",
}

function EditingTypeSelector({ value, onChange }) {
  return h(SegmentedControl, {
    fill: false,
    options: [
      { label: "Surfaces", value: EditingType.SURFACES },
      { label: "Units", value: EditingType.UNITS },
    ],
    onValueChange: (value) => onChange(value),
    value: value,
    className: "editing-type-selector",
  });
}

function ColumnCreatorDataEditor() {
  const [editingType, setEditingType] = useState(EditingType.SURFACES);

  return h(Box, { display: "flex", flexDirection: "column", gap: "1em" }, [
    h(FlexRow, { alignItems: "baseline", gap: "2em" }, [
      h("h3", "Column editor"),
      h(EditingTypeSelector, {
        value: editingType,
        onChange: (value) => setEditingType(value),
      }),
      h("div.spacer", { flex: 1 }),
    ]),
    h("div.data-editor-content", [
      h.if(editingType == "surfaces")(ColumnCreatorSurfacesEditor),
      h.if(editingType == "units")(ColumnCreatorUnitsEditor),
    ]),
  ]);
}

function ColumnCreatorSurfacesEditor() {
  const surfaces = useSelector((state) => state.initialData.surfaces);
  const setSurfaces = useSelector((state) => state.setSurfaces);

  return h(DataSheet, {
    data: surfaces,
    columnSpec: [
      {
        name: "ID",
        key: "id",
        required: true,
      },
      {
        name: "Height",
        key: "height",
        required: true,
      },
    ],
    onUpdateData: (updatedData, data) => {
      setSurfaces(reconstructData(data, updatedData));
    },
  });
}

function ColumnCreatorUnitsEditor() {
  const units = useSelector((state) => state.initialData.units);
  const setUnits = useSelector((state) => state.setUnits);

  // Sort units by their bottom position

  return h(DataSheet, {
    data: units,
    columnSpec: [
      {
        name: "Bottom",
        key: "b_surface",
      },
      {
        name: "Top",
        key: "t_surface",
      },
      { name: "Name", key: "name" },

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
        key: "pattern",
      },
    ],
    onUpdateData: (updatedData, data) => {
      // Update the units in the store
      const newData = reconstructData(data, updatedData);
      setUnits(newData);
    },
  });
}

function reconstructData<T>(data: T[], updates: Partial<T>[]): T[] {
  /** Reconstructs the data array by merging updates into the existing data. */
  const newData = Array(Math.max(data.length, updates.length));

  for (let i = 0; i < newData.length; i++) {
    const d = updates[i];
    let newRow: object = (data[i] as object) ?? {};
    if (d != null) {
      newRow = { ...newRow, ...d };
    }
    newData[i] = newRow;
  }
  return newData;
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
