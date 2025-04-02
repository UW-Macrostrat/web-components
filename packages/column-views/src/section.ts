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
  showTimescale?: boolean;
  maxInternalColumns?: number;
  timescaleLevels?: [number, number];
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

  let timescale = null;

  // Check whether we should show the timescale
  let _showTimescale = showTimescale;
  if (timescaleLevels !== null) {
    _showTimescale = true;
  }

  const paddingV = verticalSpacing / 2;

  if (axisType == ColumnAxisType.AGE && _showTimescale) {
    timescale = h(
      "div.timescale-container",
      { style: { marginTop: paddingV } },
      [
        h(Timescale, {
          orientation: TimescaleOrientation.VERTICAL,
          length: pixelHeight,
          levels: timescaleLevels ?? [2, 5],
          absoluteAgeScale: true,
          showAgeAxis: false,
          ageRange: domain as [number, number],
        }),
      ]
    );
  }

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
        timescale,
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
