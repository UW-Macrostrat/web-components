import h from "@macrostrat/hyper";
import {
  ColumnSVG,
  ColumnAxis,
  ColumnContext
} from "@macrostrat/column-components";
import { useContext } from "react";
import "@macrostrat/timescale/dist/timescale.css";
//
const AgeAxisCore = ({ ticks, tickSpacing = 40 }) => {
  const { pixelHeight } = useContext(ColumnContext);
  // A tick roughly every 40 pixels
  let v = Math.max(Math.round(pixelHeight / tickSpacing), 1);

  return h(ColumnAxis, {
    ticks: v,
    showDomain: false
  });
};

export function AgeAxis(props) {
  const {
    ticks,
    tickSpacing,
    showLabel = true,
    paddingV = 10,
    ...rest
  } = props;

  // Not sure where this extra 5px comes from.
  const marginTop = -paddingV + 5;
  return h(
    "div.column.age-axis",
    { style: { marginTop, marginBottom: -paddingV } },
    [
      h.if(showLabel)("div.age-axis-label", "Age (Ma)"),
      h(
        ColumnSVG,
        { paddingV, ...rest },
        h(AgeAxisCore, { ticks, tickSpacing })
      )
    ]
  );
}
