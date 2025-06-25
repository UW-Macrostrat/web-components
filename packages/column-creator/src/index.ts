import { ColumnCreatorData, ColumnCreatorProvider, useSelector } from "./store";
import { ColorCell, ColorPicker, DataSheet } from "@macrostrat/data-sheet";

export * from "./store";
import { FlexRow, ToasterContext } from "@macrostrat/ui-components";
import {
  BasicUnitComponent,
  Column,
  ColumnNotes,
} from "@macrostrat/column-views";
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
        h(FlexRow, { gap: "2em", alignItems: "baseline" }, [
          h(Box, { flex: 2 }, [
            h("h2", "Column creator"),
            h("p", [
              "This simple column creator shows the minimal data structure needed to graphically define a Macrostrat-like geologic column using ",
              h("em", "surfaces"),
              " and ",
              h("em", "units"),
              ".",
            ]),
            h("p", [
              "Splitting column datasets into two elements allows columns depicting complex lateral relationships (e.g., from stratigraphic charts) to be captured faithfully.",
            ]),
            h("h3", "How to use"),
            h("ol", [
              h("li", "Start by adding surfaces at a range of heights."),
              h("li", [
                "Then, link units to surfaces to define elements. You can add patterns using ",
                h(
                  "a",
                  { href: "https://davenquinn.com/projects/geologic-patterns" },
                  "FGDC geologic patterns",
                ),
                ".",
              ]),
            ]),
          ]),
          h(Box, { flex: 1 }, [
            h("h3", "Todo"),
            h("ul", [
              h("li", "Unit selection and highlighting"),
              h("li", "Data saving and loading (file and Macrostrat API)"),
              h("li", "Chronostratigraphy"),
              h(
                "li",
                "Auto-generation of units from surfaces for simple columns",
              ),
              h("li", "Additional unit metadata (e.g., lithology, etc.)"),
              h("li", "Unit nesting/hierarchy"),
            ]),
          ]),
        ]),
        h(FlexRow, { gap: "2em" }, [
          h(ColumnCreatorColumn),
          h(ColumnCreatorDataEditor),
        ]),
      ]),
    ),
  );
}

function ColumnCreatorColumn() {
  const units = useSelector((state) => state.realizedUnits);
  const axisType = useSelector((state) => state.info.axisType);
  const surfaces = useSelector((state) => state.data.surfaces);

  return h(
    Column,
    {
      units: units.filter((u) => u.errors.length == 0) as any,
      axisType,
      pixelScale: 0.8,
      allowUnitSelection: false,
      unitComponent: BasicUnitComponent,
      showLabelColumn: false,
    },
    h(ColumnSurfacesLayer, { surfaces }),
  );
}

function ColumnSurfacesLayer({ surfaces }) {
  const notes = surfaces
    .filter((d) => d.height != null)
    .map((s) => {
      return {
        id: s.id,
        note: s.id,
        height: s.height,
      };
    });

  return h(
    "div.column-surfaces-layer",
    h(ColumnNotes, {
      notes,
      paddingLeft: 30,
    }),
  );
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
      h(
        VisibilityToggle,
        {
          show: editingType === EditingType.UNITS,
        },
        h(ColumnCreatorUnitsEditor),
      ),
      h(
        VisibilityToggle,
        {
          show: editingType === EditingType.SURFACES,
        },
        h(ColumnCreatorSurfacesEditor),
      ),
    ]),
  ]);
}

function VisibilityToggle({ children, show }) {
  // Toggle visibility of children based on the show prop
  return h(
    "div.visibility-toggle",
    {
      style: {
        display: show ? "block" : "none",
      },
    },
    children,
  );
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
      setSurfaces(reconstructData(data, updatedData) as any[]);
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
          updateInfo({ axisType: { $set: (evt as any).target.value } });
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
      ],
    ),
  ]);
}
