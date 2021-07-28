import h, { C, compose } from "@macrostrat/hyper";
import { useAPIResult, DarkModeProvider } from "@macrostrat/ui-components";
import { GeologicPatternProvider } from "@macrostrat/column-components";
import {
  MacrostratAPIProvider,
  UnitSelectionProvider,
  useSelectedUnit
} from "common";
import { ColumnMapNavigator } from "common/column-map";
import Column from "./column";
import patterns from "url:../../geologic-patterns/*.png";
import { useColumnNav } from "common/macrostrat-columns";
import ModalUnitPanel from "./modal-panel";

const ColumnTitle = props => {
  return h.if(props.data != null)("h1", props.data?.col_name);
};

function ColumnManager() {
  const defaultArgs = { col_id: 495 };
  const [currentColumn, setCurrentColumn] = useColumnNav(defaultArgs);
  const selectedUnit = useSelectedUnit();
  const { col_id, ...projectParams } = currentColumn;

  const colParams = { ...currentColumn, format: "geojson" };
  const unitParams = { ...currentColumn, all: true, response: "long" };
  const columnFeature = useAPIResult("/columns", colParams, [currentColumn])
    ?.features[0];

  const unitData = useAPIResult("/units", unitParams, [currentColumn]);

  // 495
  return h("div.column-ui", [
    h("div.left-column", [
      h("div.column-view", [
        h(ColumnTitle, { data: columnFeature?.properties }),
        h.if(unitData != null)(Column, { data: unitData })
      ])
    ]),
    h("div.right-column", [
      h.if(selectedUnit == null)(ColumnMapNavigator, {
        className: "column-map",
        currentColumn: columnFeature,
        setCurrentColumn,
        margin: 0,
        ...projectParams
      }),
      h(ModalUnitPanel, { unitData })
    ])
  ]);
}

const resolvePattern = id => patterns[id];

function App() {
  return h(
    compose(
      DarkModeProvider,
      C(GeologicPatternProvider, { resolvePattern }),
      UnitSelectionProvider,
      MacrostratAPIProvider,
      ColumnManager
    )
  );
}

export default App;
