import h, { C, compose } from "@macrostrat/hyper";
import { useAPIResult, JSONView } from "@macrostrat/ui-components";
import { GeologicPatternProvider } from "@macrostrat/column-components";
import {
  MacrostratAPIProvider,
  UnitSelectionProvider,
  useSelectedUnit,
  ModalPanel,
  useUnitSelector
} from "common";
import { ColumnMapNavigator } from "common/column-map";
import Column from "./column";
import patterns from "url:../../geologic-patterns/*.png";
import { useColumnNav } from "common/macrostrat-columns";

const ColumnView = props => {
  const { params } = props;
  const data = useAPIResult("/units", {
    all: true,
    ...params,
    response: "long"
  });
  if (data == null) return null;
  return h(Column, { data });
};

const ColumnTitle = props => {
  return h.if(props.data != null)("h1", props.data?.col_name);
};

const theme = {
  scheme: "monokai",
  author: "wimer hazenberg (http://www.monokai.nl)",
  base00: "#272822",
  base01: "#383830",
  base02: "#49483e",
  base03: "#75715e",
  base04: "#a59f85",
  base05: "#f8f8f2",
  base06: "#f5f4f1",
  base07: "#f9f8f5",
  base08: "#f92672",
  base09: "#fd971f",
  base0A: "#f4bf75",
  base0B: "#a6e22e",
  base0C: "#a1efe4",
  base0D: "#66d9ef",
  base0E: "#ae81ff",
  base0F: "#cc6633"
};

function ModalUnitPanel(props) {
  const selectedUnit = useSelectedUnit();
  const onClose = useUnitSelector(null);
  if (selectedUnit == null) return null;
  return h(
    ModalPanel,
    { onClose, title: selectedUnit.unit_name, minimal: true },
    [h(JSONView, { data: selectedUnit, theme, invertTheme: true })]
  );
}

function ColumnManager() {
  const defaultArgs = { col_id: 495 };
  const [currentColumn, setCurrentColumn] = useColumnNav(defaultArgs);
  const selectedUnit = useSelectedUnit();
  const { col_id, ...projectParams } = currentColumn;

  const colParams = { ...currentColumn, format: "geojson" };
  const res = useAPIResult("/columns", colParams, [currentColumn]);
  const columnFeature = res?.features[0];

  // 495
  return h("div.column-ui", [
    h("div.left-column", [
      h("div.column-view", [
        h(ColumnTitle, { data: columnFeature?.properties }),
        h(ColumnView, { params: currentColumn })
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
      h(ModalUnitPanel)
    ])
  ]);
}

const resolvePattern = id => patterns[id];

function App() {
  return h(
    compose(
      C(GeologicPatternProvider, { resolvePattern }),
      UnitSelectionProvider,
      MacrostratAPIProvider,
      ColumnManager
    )
  );
}

export default App;
