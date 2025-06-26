import hyper from "@macrostrat/hyper";
import {
  SVG,
  ColumnAxis,
  ColumnContext,
  ColumnAxisType,
  AgeAxis,
} from "@macrostrat/column-components";
import { useContext } from "react";
import styles from "./age-axis.module.sass";
import { useCompositeScale, useMacrostratColumnData } from "./data-provider";
import { Parenthetical } from "@macrostrat/data-components";
import { PackageScaleLayoutData } from "./prepare-units/composite-scale";
import { AgeLabel } from "./unit-details";

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
  const { label = "Age", unit = "Ma", className } = props;
  return h("div.column-axis-label.age-axis-label", { className }, [
    label,
    " ",
    h.if(unit)(Parenthetical, { className: "age-axis-unit" }, unit),
  ]);
}

export function CompositeAgeAxis() {
  const { axisType, sections, totalHeight } = useMacrostratColumnData();

  const packages = sections.map((section) => {
    return {
      key: `section-${section.section_id}`,
      ...section.scaleInfo,
    };
  });

  return h(CompositeAgeAxisCore, {
    axisType,
    packages,
    totalHeight,
  });
}

export interface CompositeStratigraphicScaleInfo {
  axisType: ColumnAxisType;
  totalHeight: number;
  packages: PackageScaleLayoutData[];
}

export function CompositeAgeAxisCore(props: CompositeStratigraphicScaleInfo) {
  const { axisType, totalHeight, packages } = props;

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
      packages.map((group, i) => {
        const { key, scale } = group;

        return h(AgeAxis, {
          key,
          className: "age-axis",
          scale,
          tickSizeOuter: 3,
        });
      }),
    ),
  ]);
}

export function AgeCursor({ age }) {
  /** A cursor that shows the age at a specific point on the age axis. */
  const scale = useCompositeScale();
  const heightPx = scale(age);

  console.log(age, heightPx);

  if (age == null || heightPx == null) {
    return null;
  }

  return h(
    "div.age-cursor",
    {
      style: {
        top: heightPx,
      },
    },
    [h("div.line"), h(AgeLabel, { age, className: "label" })],
  );
}
