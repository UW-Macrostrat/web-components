import {
  CompositeUnitsColumn,
  LabelTrackerProvider,
  SectionLabelsColumn,
  SectionLabelsColumn2,
} from "./units";
import { ReactNode, useMemo } from "react";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import {
  ColumnAxisType,
  ColumnContext,
  ColumnSVG,
  SVG,
} from "@macrostrat/column-components";
import { MacrostratColumnProvider } from "./index";
import hyper from "@macrostrat/hyper";
import styles from "./column.module.sass";
import type { ExtUnit } from "./prepare-units/helpers";
import { SectionScaleInfo } from "./prepare-units/composite-scale";
import { useMacrostratUnits } from "./store";

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

export function SectionsColumn(props: SectionSharedProps) {
  const {
    sections,
    unconformityLabels = true,
    unitComponent,
    unitComponentProps,
    showLabels = true,
    width = 300,
    columnWidth = 150,
    showLabelColumn = true,
    axisType = ColumnAxisType.AGE,
    className,
    clipUnits = true,
    maxInternalColumns,
    totalHeight,
  } = props;

  const units = useMacrostratUnits();

  const col_id = units[0].col_id;

  return h(LabelTrackerProvider, { units, key: col_id }, [
    h("div.section-units-container", { style: { width: columnWidth + 2 } }, [
      h(
        SVG,
        {
          className: "sections",
          height: totalHeight,
          innerWidth: columnWidth,
          paddingH: 1,
        },
        sections.map((group, i) => {
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
              width: columnWidth,
              showLabelColumn,
              axisType,
              className: className ?? "section",
              clipUnits,
              maxInternalColumns,
            } // This unconformity is with the section _above_
          );
        })
      ),
      h.if(unconformityLabels)(UnconformityLabels, {
        sections,
        totalHeight,
        width: columnWidth,
      }),
    ]),
    h.if(showLabelColumn)(SectionLabelsColumn, {
      sections,
      totalHeight,
      width: width - columnWidth,
      axisType,
    }),
  ]);
}

function SectionUnits(props: SectionProps) {
  // Section with "squishy" time scale
  const {
    units,
    scaleInfo,
    unitComponent,
    showLabels = true,
    width = 300,
    unitComponentProps,
    axisType = ColumnAxisType.AGE,
    className,
    clipUnits = true,
    maxInternalColumns,
  } = props;

  const { domain, pixelScale, pixelHeight, paddingTop } = scaleInfo;

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
  }, [units, unitComponentProps, maxInternalColumns, width, axisType]);

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
        axisType,
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

export function CompositeTimescale(props) {
  const { sections, levels = [2, 5] } = props;

  return h(
    "div.timescale-column",
    sections.map((group, i) => {
      const { scaleInfo, section_id } = group;
      const key = `section-${section_id}`;
      return h(CompositeTimescaleSection, {
        scaleInfo,
        key,
        levels,
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

function UnconformityLabels(props) {
  const { sections, totalHeight, width } = props;

  return h(
    "div.unconformity-labels",
    {
      style: {
        width,
        height: totalHeight,
      },
    },
    sections.map((group, i) => {
      const { units, scaleInfo } = group;
      const lastGroup = sections[i - 1];
      const top = scaleInfo.offset - scaleInfo.paddingTop;
      return h(Unconformity, {
        upperUnits: lastGroup?.units,
        lowerUnits: units,
        style: {
          width,
          height: scaleInfo.paddingTop,
          top,
        },
      });
    })
  );
}

function Unconformity({ upperUnits = [], lowerUnits = [], style }) {
  if (upperUnits.length == 0 || lowerUnits.length == 0) {
    return null;
  }

  const ageGap = lowerUnits[0].t_age - upperUnits[upperUnits.length - 1].b_age;

  return h("div.unconformity", { style }, [
    h("div.unconformity-text", `${ageGap.toFixed(1)} Ma`),
  ]);
}
