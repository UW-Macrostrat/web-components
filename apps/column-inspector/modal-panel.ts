import h from "@macrostrat/hyper";
import { JSONView } from "@macrostrat/ui-components";
import { ButtonGroup, Button } from "@blueprintjs/core";
import { useSelectedUnit, ModalPanel, useUnitSelectionDispatch } from "common";
import { useEffect } from "react";

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
  const { unitData } = props;
  const selectedUnit = useSelectedUnit();
  const selectUnit = useUnitSelectionDispatch();
  if (selectedUnit == null) return null;

  const ix = unitData.findIndex(unit => unit.unit_id === selectedUnit.unit_id);

  const keyMap = {
    38: ix - 1,
    40: ix + 1
  };

  // Keyboard column selector
  useEffect(() => {
    const listener = event => {
      const nextIx = keyMap[event.keyCode];
      if (nextIx < 0 || nextIx >= unitData.length) return;
      selectUnit(unitData[nextIx]);
      event.stopPropagation();
    };

    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
    };
  }, [unitData, ix]);

  const headerChildren = h(ButtonGroup, { minimal: true }, [
    h(Button, {
      icon: "arrow-up",
      disabled: ix === 0,
      onClick() {
        selectUnit(unitData[ix - 1]);
      }
    }),
    h(Button, {
      icon: "arrow-down",
      disabled: ix === unitData.length - 1,
      onClick() {
        selectUnit(unitData[ix + 1]);
      }
    })
  ]);

  return h(
    ModalPanel,
    {
      onClose() {
        selectUnit(null);
      },
      title: selectedUnit.unit_name,
      minimal: true,
      headerChildren
    },
    h(JSONView, { data: selectedUnit, theme, invertTheme: true })
  );
}

export default ModalUnitPanel;
