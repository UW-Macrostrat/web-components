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
import { AgeLabel } from "./unit-details";
import { PackageScaleLayoutData } from "./prepare-units/types";

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
  const { label = "Age", unit = "Ma", className, height } = props;
  return h(
    "div.column-axis-label.age-axis-label",
    { className, style: { height } },
    [
      label,
      " ",
      h.if(unit)(Parenthetical, { className: "age-axis-unit" }, unit),
    ],
  );
}

interface CompositeAgeAxisProps {
  className?: string;
  style?: React.CSSProperties;
}

export function CompositeAgeAxis(rest: CompositeAgeAxisProps) {
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
    ...rest,
  });
}

export function ApproximateHeightAxis(rest: CompositeAgeAxisProps) {
  /** Axis to show approximate height based on dynamic column scales */
  const { axisType, sections, totalHeight } = useMacrostratColumnData();

  const packages = sections.map((section) => {
    const { scaleInfo } = section;
    if (scaleInfo.heightScale == null) {
      throw new Error("No height scale available for section");
    }
    return {
      key: `section-${section.section_id}`,
      ...scaleInfo,
      scale: scaleInfo.heightScale, // Use height scale instead of age scale
      // This only works with dynamic columns
    };
  });

  return h(CompositeAgeAxisCore, {
    axisType,
    axisLabel: "Approx. height",
    axisUnit: "m",
    packages,
    totalHeight,
    ...rest,
  });
}

export interface CompositeStratigraphicScaleInfo extends CompositeAgeAxisProps {
  axisType: ColumnAxisType;
  axisLabel?: string;
  axisUnit?: string;
  totalHeight: number;
  packages: PackageScaleLayoutData[];
}

export function CompositeAgeAxisCore(props: CompositeStratigraphicScaleInfo) {
  const { axisType, axisLabel, axisUnit, totalHeight, packages, ...rest } =
    props;

  if (axisType == ColumnAxisType.ORDINAL) {
    return null;
  }

  let _axisLabel: string = axisLabel ?? "Age";
  let _axisUnit = axisUnit ?? "Ma";
  if (axisType == ColumnAxisType.DEPTH) {
    _axisLabel = "Depth";
    _axisUnit = "m";
  } else if (axisType == ColumnAxisType.HEIGHT) {
    _axisLabel = "Height";
    _axisUnit = "m";
  }

  return h("div.composite-age-axis", rest, [
    h(VerticalAxisLabel, {
      label: _axisLabel,
      unit: _axisUnit,
      height: totalHeight,
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
