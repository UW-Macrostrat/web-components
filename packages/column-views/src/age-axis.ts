import h from "@macrostrat/hyper";
import {
  ColumnSVG,
  ColumnAxis,
  ColumnContext,
} from "@macrostrat/column-components";
import { useContext } from "react";

const AgeAxisCore = ({ ticks, tickSpacing = 40, showDomain = false }) => {
  const { pixelHeight } = useContext(ColumnContext);
  // A tick roughly every 40 pixels
  let v = Math.max(Math.round(pixelHeight / tickSpacing), 1);

  return h("g.axis", { transform: "translate(20 0)" }, [
    h(ColumnAxis, {
      ticks: v,
      showDomain,
    }),
  ]);
};

export function VerticalAxisLabel(props) {
  const { label, unit, className } = props;
  return h("div.column-axis-label.age-axis-label", { className }, [
    label,
    h.if(unit)("span.age-axis-unit-container", [" (", unit, ")"]),
  ]);
}

export function ColumnVerticalAxis(props) {
  const {
    ticks,
    tickSpacing,
    showLabel = true,
    label,
    unit,
    paddingV = 10,
    showDomain,
    className,
    ...rest
  } = props;

  // Not sure where this extra 5px comes from.
  return h("div.column.vertical-axis", { className }, [
    h.if(showLabel)(VerticalAxisLabel, { label, unit }),
    h(
      ColumnSVG,
      { paddingV, ...rest },
      h(AgeAxisCore, { ticks, tickSpacing, showDomain })
    ),
  ]);
}

export function AgeAxis(props) {
  return h(ColumnVerticalAxis, {
    ...props,
    label: "Age",
    unit: "Ma",
  });
}
