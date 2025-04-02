import { CompositeUnitsColumn } from "./units";
import { ReactNode, useMemo } from "react";
import { ColumnVerticalAxis } from "./age-axis";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import { ColumnAxisType, ColumnSVG } from "@macrostrat/column-components";
import { MacrostratColumnProvider } from "./index";
import hyper from "@macrostrat/hyper";
import styles from "./column.module.sass";
import type { ExtUnit } from "./prepare-units/helpers";
import { SectionScaleInfo } from "./prepare-units/composite-scale";

const h = hyper.styled(styles);

export interface SectionInfo {
  section_id: number | number[];
  t_age: number;
  b_age: number;
  units: ExtUnit[];
}

export interface SectionSharedProps {
  unitComponent?: React.FunctionComponent<any>;
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
}

export interface SectionProps extends SectionSharedProps {
  units: ExtUnit[];
  scaleInfo: SectionScaleInfo;
}

export function Section(props: SectionProps) {
  // Section with "squishy" time scale
  const {
    units,
    scaleInfo,
    unitComponent,
    showLabels = true,
    width = 300,
    columnWidth = 150,
    unitComponentProps,
    showLabelColumn = true,
    axisType = ColumnAxisType.AGE,
    className,
    children,
    clipUnits = true,
    showTimescale = true,
    timescaleLevels,
    maxInternalColumns,
    verticalSpacing = 20,
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
        maxInternalColumns ?? Math.floor(columnWidth / 10),
        unitComponentProps?.nColumns ?? Infinity,
        Math.max(...units.map((d) => d.column)) + 1
      ),
      //axisType,
    };
  }, [units, unitComponentProps, maxInternalColumns, columnWidth, axisType]);

  const paddingV = verticalSpacing / 2;

  const style = {
    "--section-height": `${pixelHeight}px`,
    "--section-width": `${columnWidth}px`,
  };

  return h(
    MacrostratColumnProvider,
    {
      units,
      domain,
      pixelScale, // Actually pixels per myr,
      axisType,
    },
    [
      h("div.section", { className, style }, [
        h("div.section-main", [
          h(
            ColumnSVG,
            {
              innerWidth: showLabels ? width : columnWidth,
              paddingRight: 1,
              paddingLeft: 1,
              paddingV,
              innerHeight: pixelHeight,
            },
            [
              h(CompositeUnitsColumn, {
                showLabelColumn: showLabelColumn,
                width: showLabels ? width : columnWidth,
                columnWidth,
                gutterWidth: 5,
                showLabels,
                unitComponent,
                unitComponentProps: _unitComponentProps,
                clipToFrame: clipUnits,
              }),
            ]
          ),
          children,
        ]),
      ]),
    ]
  );
}

export function CompositeTimescale(props) {
  const { sections, levels = [2, 5], unconformityHeight } = props;

  let totalHeight = 0;
  return h(
    "div.main-column",
    sections.map((group, i) => {
      const { scaleInfo, section_id } = group;

      const { pixelHeight, offset } = scaleInfo;

      totalHeight = offset + pixelHeight;

      const key = `section-${section_id}`;
      console.log("Rendering section", key, group, scaleInfo);

      return h(CompositeTimescaleSection, {
        scaleInfo,
        key,
        levels,
        verticalSpacing: unconformityHeight,
      });
    })
  );
}

export function CompositeTimescaleSection(props: SectionProps) {
  const { scaleInfo, levels } = props;

  const { domain, pixelHeight, paddingTop } = scaleInfo;

  return h("div.timescale-container", { style: { paddingTop } }, [
    h(Timescale, {
      orientation: TimescaleOrientation.VERTICAL,
      length: pixelHeight,
      levels,
      absoluteAgeScale: true,
      showAgeAxis: false,
      ageRange: domain as [number, number],
    }),
  ]);
}
