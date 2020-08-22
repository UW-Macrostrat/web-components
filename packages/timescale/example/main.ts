import { render } from "react-dom";
import h from "@macrostrat/hyper";
import { Timescale, TimescaleOrientation } from "../src";
import "./main.styl";

function TimescaleUI() {
  return h(Timescale, { orientation: TimescaleOrientation.VERTICAL });
}

render(h(TimescaleUI), document.getElementById("root"));
