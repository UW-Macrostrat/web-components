import h from "@macrostrat/hyper";
import {
  ColumnSVG,
  ColumnAxis,
  ColumnContext
} from "@macrostrat/column-components";
import { useContext } from "react";
// import "@macrostrat/timescale/dist/timescale.css";
//
const AgeAxisCore = ({ ticks, tickSpacing = 40, showDomain = false }) => {
  const { pixelHeight } = useContext(ColumnContext);
  // A tick roughly every 40 pixels
  let v = Math.max(Math.round(pixelHeight / tickSpacing), 1);

  return h("g.axis", { transform: "translate(20 0)" }, [
    h(ColumnAxis, {
      ticks: v,
      showDomain
    })
  ]);
};

export function AgeAxis(props) {
  const {
    ticks,
    tickSpacing,
    showLabel = true,
    paddingV = 10,
    showDomain,
    ...rest
  } = props;

  // Not sure where this extra 5px comes from.
  return h("div.column.age-axis", [
    h.if(showLabel)("div.age-axis-label", "Age (Ma)"),
    h(
      ColumnSVG,
      { paddingV, ...rest },
      h(AgeAxisCore, { ticks, tickSpacing, showDomain })
    )
  ]);
}
