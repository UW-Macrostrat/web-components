import { C, compose, hyperStyled } from "@macrostrat/hyper";
import { useAPIResult, DarkModeProvider } from "@macrostrat/ui-components";
import { GeologicPatternProvider } from "@macrostrat/column-components";
import {
  MacrostratAPIProvider,
  UnitSelectionProvider,
  useSelectedUnit
} from "common";
import { useState } from "react";
import ColumnMap from "./column-picker";
import Column from "./column";
import patterns from "url:../../geologic-patterns/*.png";
import { useColumnNav } from "common/macrostrat-columns";
import ModalUnitPanel from "./modal-panel";
import { preprocessUnits } from "./process-data";
import { ColumnAxisType } from "@macrostrat/column-components";
import styles from "./age-model.module.styl";
import { ThreeColumnLayout } from "@macrostrat/ui-components";

const h = hyperStyled(styles);

const ColumnTitle = props => {
  return h.if(props.data != null)([
    " – ",
    h("span.column-title", props.data?.col_name)
  ]);
};

//macrostrat.org/api/units?col_id=5156&status_code=in%20process&show_position=true&response=long

function AppMain() {
  const defaultArgs = {
    col_id: 5156,
    status_code: "in process",
    project_id: 3
  };
  const [currentColumn, setCurrentColumn] = useColumnNav(defaultArgs);
  const selectedUnit = useSelectedUnit();
  const { col_id, ...projectParams } = currentColumn;

  const colParams = { ...currentColumn, format: "geojson" };
  const unitParams = {
    ...currentColumn,
    show_position: true,
    all: true,
    response: "long"
  };
  const columnFeature = useAPIResult("/defs/columns", colParams, [
    currentColumn
  ])?.features[0];

  const unitData = useAPIResult("/units", unitParams, [currentColumn]);

  if (unitData == null) return null;

  const units = preprocessUnits(unitData);

  const detailPanel = h(ModalUnitPanel, {
    className: "unit-details",
    unitData: units,
    setIsShown: () => {}
  });

  // 495
  const contextPanel = h(ColumnMap, {
    className: "column-map",
    currentColumn: columnFeature,
    setCurrentColumn,
    margin: 0,
    height: 500,
    color: "dodgerblue",
    apiRoute: "/defs/columns",
    ...projectParams,
    filterColumns(col) {
      return col.properties.t_units > 0;
    }
  });

  return h(
    ThreeColumnLayout,
    {
      title: h("span.title", [
        "eODP age model viewer",
        h(ColumnTitle, { data: columnFeature?.properties })
      ]),
      contextPanel,
      detailPanel,
      panelState: {
        detail: selectedUnit != null
      }
    },
    h("div.column-view", [
      h.if(unitData != null)(Column, {
        data: unitData,
        axisType: ColumnAxisType.HEIGHT
      })
    ])
  );
}

const resolvePattern = id => patterns[id];

function App() {
  return h(
    compose(
      DarkModeProvider,
      C(GeologicPatternProvider, { resolvePattern }),
      UnitSelectionProvider,
      C(MacrostratAPIProvider, { useDev: false }),
      AppMain
    )
  );
}

export default App;
