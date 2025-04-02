import { CompositeUnitsColumn } from "./units";
import { ReactNode, useMemo } from "react";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import { ColumnAxisType, ColumnSVG, SVG } from "@macrostrat/column-components";
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

  return h([
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
              width,
              columnWidth,
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
    h(
      "div.main-column",
      { className: "sections", height: totalHeight },
      sections.map((group, i) => {
        const { units, scaleInfo, section_id } = group;

        const key = `section-${section_id}`;
        return h(
          Section,
          {
            units,
            scaleInfo,
            key,
            unitComponent,
            unitComponentProps,
            showLabels,
            width,
            columnWidth,
            showLabelColumn,
            axisType,
            className: className ?? "section",
            clipUnits,
            maxInternalColumns,
          } // This unconformity is with the section _above_
        );
      })
    ),
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
    columnWidth = 150,
    unitComponentProps,
    showLabelColumn = true,
    axisType = ColumnAxisType.AGE,
    className,
    children,
    clipUnits = true,
    maxInternalColumns,
    verticalSpacing = 20,
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
        showLabelColumn: showLabelColumn,
        width: showLabels ? width : columnWidth,
        columnWidth,
        gutterWidth: 5,
        showLabels,
        unitComponent,
        unitComponentProps: _unitComponentProps,
        clipToFrame: clipUnits,
      })
    )
  );
}

function Section(props: SectionProps) {
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
    maxInternalColumns,
    verticalSpacing = 20,
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
    paddingTop,
  };

  return h("div.section", { className, style }, [
    h("div.section-main", [
      h(
        ColumnSVG,
        {
          innerWidth: showLabels ? width : columnWidth,
          paddingRight: 1,
          paddingLeft: 1,
          paddingV,
          innerHeight: pixelHeight,
          marginV: -paddingV,
        },
        h(
          MacrostratColumnProvider,
          {
            units,
            domain,
            pixelScale, // Actually pixels per myr,
            axisType,
          },
          h(CompositeUnitsColumn, {
            showLabelColumn: showLabelColumn,
            width: showLabels ? width : columnWidth,
            columnWidth,
            gutterWidth: 5,
            showLabels,
            unitComponent,
            unitComponentProps: _unitComponentProps,
            clipToFrame: clipUnits,
          })
        )
      ),
      children,
    ]),
  ]);
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
