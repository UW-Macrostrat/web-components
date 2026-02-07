import h from "../main.module.sass";
import { useTimescale } from "../provider";
import { TimescaleOrientation } from "../types";
import { format } from "d3-format";

const fmt = format(".0f");

function Cursor({ age }) {
  const { scale, orientation } = useTimescale();
  const k = orientation == TimescaleOrientation.HORIZONTAL ? "left" : "top";
  const style = { [k]: scale(age) };

  return h("div.cursor", { style }, [
    h("div.cursor-text", fmt(age) + " Ma"),
    h("div.cursor-line"),
  ]);
}

export { Cursor };
