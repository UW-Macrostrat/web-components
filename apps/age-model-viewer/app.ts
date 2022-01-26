import { C, compose, hyperStyled } from "@macrostrat/hyper";
import { useAPIResult, DarkModeProvider } from "@macrostrat/ui-components";
import { GeologicPatternProvider } from "@macrostrat/column-components";
import {
  MacrostratAPIProvider,
  UnitSelectionProvider,
  useSelectedUnit
} from "common";
import { Button } from "@blueprintjs/core";
import { CSSTransition } from "react-transition-group";
import { useState } from "react";
import ColumnMap from "./column-picker";
import Column from "./column";
import patterns from "url:../../geologic-patterns/*.png";
import { useColumnNav } from "common/macrostrat-columns";
import ModalUnitPanel from "./modal-panel";
import { preprocessUnits } from "./process-data";
import { ColumnAxisType } from "@macrostrat/column-components";
import styles from "./age-model.module.styl";
const h = hyperStyled(styles);

const ColumnTitle = props => {
  return h.if(props.data != null)("h1", props.data?.col_name);
};

//macrostrat.org/api/units?col_id=5156&status_code=in%20process&show_position=true&response=long

https: function ColumnManager() {
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

  const [showContext, setShowContext] = useState(true);

  const unitData = useAPIResult("/units", unitParams, [currentColumn]);

  if (unitData == null) return null;

  const units = preprocessUnits(unitData);

  // 495
  return h("div.column-ui", [
    h(
      CSSTransition,
      {
        in: showContext,
        timeout: 300,
        unmountOnExit: true,
        onEnter() {}
      },
      [
        h("div.left-column", [
          h(ColumnMap, {
            className: "column-map",
            currentColumn: columnFeature,
            setCurrentColumn,
            margin: 0,
            color: "dodgerblue",
            apiRoute: "/defs/columns",
            ...projectParams,
            filterColumns(col) {
              return col.properties.t_units > 0;
            }
          })
        ])
      ]
    ),
    h("div.main-column", [
      h(
        Button,
        { onClick: () => setShowContext(!showContext) },
        "Toggle Context"
      ),
      h("div.column-view", [
        h(ColumnTitle, { data: columnFeature?.properties }),
        h.if(unitData != null)(Column, {
          data: unitData,
          axisType: ColumnAxisType.HEIGHT
        })
      ])
    ]),
    h("div.right-column", [h(ModalUnitPanel, { unitData })])
  ]);
}

const resolvePattern = id => patterns[id];

function App() {
  return h(
    compose(
      DarkModeProvider,
      C(GeologicPatternProvider, { resolvePattern }),
      UnitSelectionProvider,
      C(MacrostratAPIProvider, { useDev: false }),
      ColumnManager
    )
  );
}

export default App;
