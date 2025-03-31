import {
  ColoredUnitComponent,
  Column,
  ColumnNavigationMap,
  preprocessUnits,
} from "@macrostrat/column-views";
import { hyperStyled } from "@macrostrat/hyper";
import { useMemo } from "react";
import styles from "./index.module.sass";

import { Spinner } from "@blueprintjs/core";
import { useColumnBasicInfo, useColumnUnits } from "./utils";
import { ColumnAxisType } from "@macrostrat/column-components/src";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

const h = hyperStyled(styles);

export function ColumnStoryUI({
  columnID,
  setColumn,
  selectedUnit,
  setSelectedUnit,
  ...rest
}) {
  const columnInfo = useColumnBasicInfo(columnID);
  const units = useColumnUnits(columnID);

  if (units == null || columnInfo == null) {
    return h(Spinner);
  }

  return h("div.column-ui", [
    h(
      "div.column-container",
      h(ColumnCore, {
        col_id: columnID,
        selectedUnit,
        setSelectedUnit,
        ...rest,
      })
    ),
    h("div.right-column", [
      h(ColumnNavigationMap, {
        inProcess: false,
        projectID: null,
        accessToken: mapboxToken,
        selectedColumn: columnID,
        onSelectColumn: setColumn,
        className: "column-selector-map",
      }),
    ]),
  ]);
}

function ColumnCore({ col_id, selectedUnit, setSelectedUnit, ...rest }) {
  const units = useColumnUnits(col_id);
  const info = useColumnBasicInfo(col_id);

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
      unitComponentProps: {
        nColumns: 10,
      },
      ...rest,
    }),
  ]);
}
