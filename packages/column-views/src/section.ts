import {
  CompositeUnitsColumn,
  LabelTrackerProvider,
  SectionLabelsColumn,
} from "./units";
import { ReactNode, FunctionComponent, useMemo } from "react";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import { ColumnAxisType, SVG } from "@macrostrat/column-components";
import hyper from "@macrostrat/hyper";
import styles from "./column.module.sass";
import type { ExtUnit } from "./prepare-units/helpers";
import { PackageScaleLayoutData } from "./prepare-units/composite-scale";
import {
  useMacrostratColumnData,
  useMacrostratUnits,
  MacrostratColumnProvider,
} from "./data-provider";
import { Duration } from "./unit-details";

const h = hyper.styled(styles);

export interface SectionSharedProps {
  unitComponent?: FunctionComponent<any>;
  unitComponentProps?: any;
  showLabels?: boolean;
  width?: number;
  columnWidth?: number;
  children?: ReactNode;
  showLabelColumn?: boolean;
  axisType?: ColumnAxisType;
  className?: string;
  clipUnits?: boolean;
  maxInternalColumns?: number;
  // Space between sections
  verticalSpacing?: number;
  // Whether to render unconformity labels
  unconformityLabels?: boolean;
}

export interface SectionProps extends SectionSharedProps {
  units: ExtUnit[];
  scaleInfo: PackageScaleLayoutData;
}

export function SectionsColumn(props: SectionSharedProps) {
  const {
    unconformityLabels = true,
    unitComponent,
    unitComponentProps,
    showLabels = true,
    width = 300,
    columnWidth = 150,
    showLabelColumn = true,
    clipUnits = true,
    maxInternalColumns,
  } = props;

  const units = useMacrostratUnits();

  // Get a unique key for the column
  const key = units[0]?.unit_id;

  return h(LabelTrackerProvider, { units, key }, [
    h(SectionUnitsColumn, {
      width: columnWidth,
      unitComponent,
      unitComponentProps,
      showLabels,
      clipUnits,
      maxInternalColumns,
      unconformityLabels,
    }),
    h.if(showLabelColumn)(SectionLabelsColumn, {
      width: width - columnWidth,
    }),
  ]);
}

function SectionUnitsColumn(props: SectionSharedProps) {
  const {
    width,
    showLabels,
    unitComponent,
    unitComponentProps,
    clipUnits,
    maxInternalColumns,
    unconformityLabels = true,
  } = props;

  const { sections, totalHeight } = useMacrostratColumnData();

  const scaleData: PackageScaleLayoutData[] = sections.map((section) => {
    return section.scaleInfo;
  });

  const innerWidth = width - 2;

  return h("div.section-units-container", { style: { width } }, [
    h(
      SVG,
      {
        className: "sections",
        height: totalHeight,
        innerWidth,
        paddingH: 1,
      },
      sections.map((group) => {
        const { units, scaleInfo, section_id } = group;

        const key = `section-${section_id}`;
        return h(
          SectionUnits,
          {
            units,
            scaleInfo,
            key,
            unitComponent,
            unitComponentProps,
            showLabels,
            width: innerWidth,
            clipUnits,
            maxInternalColumns,
          } // This unconformity is with the section _above_
        );
      })
    ),
    h.if(unconformityLabels)(UnconformityLabels, {
      width,
      sections: scaleData,
      totalHeight,
    }),
  ]);
}

function SectionUnits(props: SectionProps) {
  // Section with "squishy" timescale
  const {
    units,
    scaleInfo,
    unitComponent,
    showLabels = true,
    width = 300,
    unitComponentProps,
    className,
    clipUnits = true,
    maxInternalColumns,
  } = props;

  const { domain, pixelScale, pixelHeight } = scaleInfo;

  /** Ensure that we can arrange units into the maximum number
   * of columns defined by unitComponentProps, but that we don't
   * use more than necessary.
   */
  const _unitComponentProps = useMemo(() => {
    return {
      ...unitComponentProps,
      nColumns: Math.min(
        maxInternalColumns ?? Math.floor(width / 10),
        unitComponentProps?.nColumns ?? Infinity,
        Math.max(...units.map((d) => d.column)) + 1
      ),
      //axisType,
    };
  }, [units, unitComponentProps, maxInternalColumns, width]);

  const style = {
    "--section-height": `${pixelHeight}px`,
    "--section-width": `${width}px`,
  };

  return h(
    "g.section",
    { className, style, transform: `translate(0 ${scaleInfo.offset})` },
    h(
      MacrostratColumnProvider,
      {
        units,
        domain,
        pixelScale, // Actually pixels per myr,
      },
      h(CompositeUnitsColumn, {
        width,
        showLabels,
        unitComponent,
        unitComponentProps: _unitComponentProps,
        clipToFrame: clipUnits,
      })
    )
  );
}

interface CompositeTimescaleProps {
  levels?: [number, number] | number;
}

export function CompositeTimescale(props: CompositeTimescaleProps) {
  const { sections } = useMacrostratColumnData();
  const sectionScales = sections.map((section) => {
    return section.scaleInfo;
  });

  return h(CompositeTimescaleCore, {
    packages: sectionScales,
    ...props,
  });
}

type CompositeTimescaleCoreProps = CompositeTimescaleProps & {
  packages: PackageScaleLayoutData[];
  unconformityLabels?: boolean;
};

export function CompositeTimescaleCore(props: CompositeTimescaleCoreProps) {
  const { levels = 3, packages, unconformityLabels = false } = props;

  let _levels: [number, number];
  if (typeof levels === "number") {
    // If levels is a number, use the most common starting level
    _levels = [2, Math.max(2 + Math.min(levels, 5) - 1, 1)];
  } else {
    _levels = levels;
  }

  const nCols = _levels[1] - _levels[0] + 1;

  return h("div.timescale-column", [
    h(
      "div.timescales",
      packages.map((group) => {
        const { domain, pixelHeight, paddingTop, key } = group;
        return h(
          "div.timescale-container",
          { style: { paddingTop, "--timescale-level-count": nCols }, key },
          [
            h(Timescale, {
              orientation: TimescaleOrientation.VERTICAL,
              length: pixelHeight,
              levels: _levels,
              absoluteAgeScale: true,
              showAgeAxis: false,
              ageRange: domain as [number, number],
            }),
          ]
        );
      })
    ),
    h.if(unconformityLabels)(UnconformityLabels, {
      width: "100%",
      sections: packages,
      className: "unconformity-labels",
    }),
  ]);
}

export function UnconformityLabels(props: {
  width: number;
  sections: PackageScaleLayoutData[];
  className?: string;
}) {
  const { width, sections, className } = props;

  return h(
    "div.unconformity-labels",
    {
      style: {
        width,
      },
      className,
    },
    sections.map((scaleInfo, i) => {
      const lastGroup = sections[i - 1];
      const top = scaleInfo.offset - scaleInfo.paddingTop;
      const upperAge = lastGroup?.domain[0];
      const lowerAge = scaleInfo.domain[1];
      return h(Unconformity, {
        upperAge,
        lowerAge,
        style: {
          width,
          height: scaleInfo.paddingTop,
          top,
        },
      });
    })
  );
}

function Unconformity({ upperAge, lowerAge, style }) {
  if (upperAge == null || lowerAge == null) {
    return null;
  }

  const ageGap = Math.abs(upperAge - lowerAge);

  let className: string = null;
  if (ageGap > 1000) {
    className = "giga";
  } else if (ageGap > 100) {
    className = "mega";
  } else if (ageGap > 10) {
    className = "large";
  } else if (ageGap < 1) {
    className = "small";
  }

  return h("div.unconformity", { style, className }, [
    h("div.unconformity-text", h(Duration, { value: ageGap })),
  ]);
}
