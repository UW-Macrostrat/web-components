import { render } from "react-dom";
import h from "@macrostrat/hyper";
import { Timescale, TimescaleProps, TimescaleOrientation } from "../src";
import { useState } from "react";
import {
  Card,
  ButtonGroup,
  Button,
  Switch,
  FormGroup,
  RangeSlider,
} from "@blueprintjs/core";
import classNames from "classnames";
import { useLocalStorage } from "@rehooks/local-storage";
import "@blueprintjs/core/lib/css/blueprint.css";
import "./main.scss";

const defaultProps = {
  orientation: TimescaleOrientation.VERTICAL,
  absoluteAgeScale: false,
  levels: null,
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
  const [state, setState] = useLocalStorage("timescaleProps", defaultProps);
  const { orientation, absoluteAgeScale } = state;
  const className = classNames(orientation);
  return h("div.ui", [
    h("div.timescale-ui", { className }, [
      h(Timescale, state),
      h("div.spacer"),
      h("div.control-array", [
        h(Card, { className: "control-panel" }, [
          h("h2.bp3-heading", "Geologic timescale"),
          h(OrientationControl, {
            orientation,
            setOrientation(orientation) {
              setState({ ...state, orientation });
            },
          }),
          h(Switch, {
            onChange() {
              setState({ ...state, absoluteAgeScale: !absoluteAgeScale });
            },
            checked: absoluteAgeScale,
            label: "Absolute age scale",
          }),
          h(FormGroup, { label: "Levels" }, [
            h(RangeSlider, {
              min: 0,
              max: 5,
              onChange(levels) {
                setState({ ...state, levels });
              },
              value: state.levels ?? [0, 5],
            }),
          ]),
        ]),
      ]),
    ]),
  ]);
}

render(h(TimescaleUI), document.getElementById("root"));
