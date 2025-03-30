import {
  ColoredUnitComponent,
  Column,
  ColumnNavigationMap,
  preprocessUnits,
} from "@macrostrat/column-views";
import { hyperStyled } from "@macrostrat/hyper";
import { useMemo, useState } from "react";
import styles from "./index.module.sass";

import { Spinner } from "@blueprintjs/core";
import { useColumnBasicInfo, useColumnUnits } from "./utils";

const mapboxToken = import.meta.env.VITE_MAPBOX_API_TOKEN;

const h = hyperStyled(styles);

export function ColumnUI() {
  const [columnID, setColumn] = useState(432);

  const columnInfo = useColumnBasicInfo(columnID);
  const units = useColumnUnits(columnID);

  if (units == null || columnInfo == null) {
    return h(Spinner);
  }

  return h("div.column-ui", [
    h("div.column-container", h(ColumnCore, { col_id: columnID })),
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

function ColumnCore({ col_id }) {
  const units = useColumnUnits(col_id);
  const info = useColumnBasicInfo(col_id);

  const data = useMemo(() => {
    if (units == null) return null;
    return preprocessUnits(units);
  }, [units]);

  if (data == null || info == null) {
    return h(Spinner);
  }

  return h("div.column-container", [
    h("h2", info.col_name),
    h(Column, {
      data,
      unconformityLabels: true,
      keyboardNavigation: true,
      columnWidth: 300,
      showUnitPopover: true,
      width: 450,
      unitComponent: ColoredUnitComponent,
      unitComponentProps: {
        nColumns: 10,
      },
    }),
  ]);
}
