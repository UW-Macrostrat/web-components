import { C, compose, hyperStyled } from "@macrostrat/hyper";
import { useAPIResult, DarkModeProvider } from "@macrostrat/ui-components";
import { GeologicPatternProvider } from "@macrostrat/column-components";
import {
  MacrostratAPIProvider,
  UnitSelectionProvider,
  useSelectedUnit
} from "common";
import ColumnMap from "./column-picker";
import Column from "./column";
import patterns from "url:../../geologic-patterns/*.png";
import { useColumnNav } from "common/macrostrat-columns";
import ModalUnitPanel from "./modal-panel";
import { preprocessUnits } from "./process-data";
import { ColumnAxisType } from "@macrostrat/column-components";
import styles from "./age-model.module.styl";
import {
  ThreeColumnLayout,
  useLayoutDispatch
} from "@macrostrat/ui-components";
import { NonIdealState, Spinner } from "@blueprintjs/core";
import { useEffect } from "react";

const h = hyperStyled(styles);

const ColumnTitle = props => {
  return h.if(props.data != null)([
    " – ",
    h("span.column-title", props.data?.col_name)
  ]);
};

function ColumnView({ unitData }) {
  if (unitData == null)
    return h(NonIdealState, { title: "Loading" }, h(Spinner));
  if (unitData.length === 0)
    return h(NonIdealState, {
      title: "Data unavailable",
      icon: "inbox",
      description: "No units have yet been captured for this core"
    });

  return h("div.column-view", [
    h.if(unitData != null)(Column, {
      data: unitData,
      axisType: ColumnAxisType.HEIGHT
    })
  ]);
}

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

  const units = preprocessUnits(unitData ?? []);

  const dispatch = useLayoutDispatch();

  useEffect(() => {
    dispatch({
      type: "show-panel",
      panel: ThreeColumnLayout.Panels.Detail,
      shouldShow: selectedUnit != null
    });
  }, [selectedUnit]);

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
    h(ColumnView, { unitData })
  );
}

const resolvePattern = id => patterns[id];

function App() {
  return h(
    compose(
      //DarkModeProvider,
      C(GeologicPatternProvider, { resolvePattern }),
      UnitSelectionProvider,
      C(MacrostratAPIProvider, { useDev: false }),
      AppMain
    )
  );
}

export default App;
