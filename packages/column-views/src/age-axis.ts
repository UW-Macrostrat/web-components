import hyper from "@macrostrat/hyper";
import {
  SVG,
  ColumnSVG,
  ColumnAxis,
  ColumnContext,
  ColumnAxisType,
  AgeAxis,
} from "@macrostrat/column-components";
import { useContext } from "react";
import styles from "./age-axis.module.sass";
import { MacrostratColumnProvider } from "./data-provider";
import { SectionProps } from "./section";

const h = hyper.styled(styles);

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

export function CompositeAgeAxis(props) {
  const { axisType = ColumnAxisType.AGE, sections, totalHeight } = props;

  if (axisType == ColumnAxisType.ORDINAL) {
    return null;
  }

  let axisLabel: string = "Age";
  let axisUnit = "Ma";
  if (axisType == ColumnAxisType.DEPTH) {
    axisLabel = "Depth";
    axisUnit = "m";
  } else if (axisType == ColumnAxisType.HEIGHT) {
    axisLabel = "Height";
    axisUnit = "m";
  }

  return h([
    h(VerticalAxisLabel, {
      label: axisLabel,
      unit: axisUnit,
    }),
    h(
      SVG,
      {
        className: "age-axis-column",
        style: { width: `22px`, height: `${totalHeight}px` },
        width: 22,
        height: totalHeight,
      },
      sections.map((group, i) => {
        const { scaleInfo, section_id } = group;

        return h(AgeAxis, {
          key: `section-${section_id}`,
          className: "age-axis",
          scale: scaleInfo.scale,
          tickSizeOuter: 3,
        });
      })
    ),
  ]);
}
