import { render } from "react-dom";
import h from "@macrostrat/hyper";
import { Timescale, TimescaleProps, TimescaleOrientation } from "../src";
import { useState } from "react";
import { Card, ButtonGroup, Button } from "@blueprintjs/core";
import "@blueprintjs/core/lib/css/blueprint.css";
import "./main.styl";

const defaultProps = {
  orientation: TimescaleOrientation.VERTICAL,
};

function OrientationControl({ orientation, setOrientation }) {
  return h(
    ButtonGroup,
    null,
    Object.values(TimescaleOrientation).map((d) =>
      h(
        Button,
        {
          active: d == orientation,
          onClick() {
            setOrientation(d);
          },
        },
        d.charAt(0).toUpperCase() + d.slice(1)
      )
    )
  );
}

function TimescaleUI() {
  const [state, setState] = useState<TimescaleProps>(defaultProps);
  return h("div.ui", [
    h("div.timescale-ui", [
      h(Timescale, state),
      h("div.spacer"),
      h("div.control-array", [
        h(Card, { className: "control-panel" }, [
          h("h2.bp3-heading", "Geologic timescale"),
          h(OrientationControl, {
            orientation: state.orientation,
            setOrientation(orientation) {
              setState({ ...state, orientation });
            },
          }),
        ]),
      ]),
    ]),
  ]);
}

render(h(TimescaleUI), document.getElementById("root"));
