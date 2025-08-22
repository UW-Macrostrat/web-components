import {
  ColoredUnitComponent,
  Column,
  ColumnNavigationMap,
} from "@macrostrat/column-views";
import { hyperStyled } from "@macrostrat/hyper";
import styles from "./story-ui.module.sass";

import { Spinner } from "@blueprintjs/core";
import { useColumnBasicInfo, useColumnUnits } from "./utils";
import { UnitLong } from "@macrostrat/api-types";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

const h = hyperStyled(styles);

export function ColumnStoryUI({
  columnID,
  setColumn,
  selectedUnit,
  setSelectedUnit,
  inProcess,
  projectID,
  ...rest
}) {
  return h("div.column-ui", [
    h(
      "div.column-container",
      h(ColumnCore, {
        col_id: columnID,
        selectedUnit,
        setSelectedUnit,
        inProcess,
        ...rest,
      }),
    ),
    h("div.right-column", [
      h(ColumnNavigationMap, {
        inProcess,
        projectID,
        accessToken: mapboxToken,
        selectedColumn: columnID,
        onSelectColumn: setColumn,
        className: "column-selector-map",
      }),
    ]),
  ]);
}

function ColumnCore({
  col_id,
  inProcess,
  selectedUnit,
  setSelectedUnit,
  ...rest
}) {
  const units = useColumnUnits(col_id, inProcess) as any as UnitLong[];
  const info = useColumnBasicInfo(col_id, inProcess);

  if (units == null || info == null) {
    return h(Spinner);
  }

  return h("div.column-container", [
    h("h2", info.col_name),
    h(Column, {
      key: col_id,
      units,
      selectedUnit,
      onUnitSelected: (unit_id) => {
        setSelectedUnit(unit_id);
      },
      unconformityLabels: true,
      keyboardNavigation: true,
      columnWidth: 300,
      showUnitPopover: true,
      width: 450,
      unitComponent: ColoredUnitComponent,
      ...rest,
    }),
  ]);
}
