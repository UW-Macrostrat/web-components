import { CompositeUnitsColumn } from "./units";
import { ReactNode, useMemo } from "react";
import { ColumnVerticalAxis } from "./age-axis";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import { ColumnAxisType, ColumnSVG } from "@macrostrat/column-components";
import { MacrostratColumnProvider } from "./index";
import hyper from "@macrostrat/hyper";
import styles from "./column.module.sass";
import type { ExtUnit } from "./prepare-units/helpers";

const h = hyper.styled(styles);

export interface SectionInfo {
  section_id: number | number[];
  t_age: number;
  b_age: number;
  units: ExtUnit[];
}

export interface ColumnHeightScaleOptions {
  /** A fixed pixel scale to use for the section (pixels per Myr) */
  pixelScale?: number;
  /** The target height of a constituent unit in pixels, for dynamic
   * scale generation */
  targetUnitHeight?: number;
  /** The minimum pixel scale to use for the section (pixels per Myr) */
  minPixelScale?: number;
  // Axis scale type
  axisType?: ColumnAxisType;
}

export interface SectionSharedProps {
  units: ExtUnit[];
  range?: [number, number];
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
        h.if(axisType != ColumnAxisType.ORDINAL)(ColumnVerticalAxis, {
          width: 20,
          padding: 0,
          paddingV,
          showLabel: false,
        }),
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

export interface SectionScaleOptions extends ColumnHeightScaleOptions {
  axisType: ColumnAxisType;
  domain: [number, number];
}

/** Output of a section scale. For now, this assumes that the
 * mapping is linear, but it could be extended to support arbitrary
 * scale functions.
 */
export interface SectionScaleInfo {
  domain: [number, number];
  pixelScale: number;
  pixelHeight: number;
  // TODO: add a function
}

export type SectionInfoExt = SectionInfo & {
  scaleInfo: SectionScaleInfo & {
    offset: number;
  };
};

interface CompositeScaleInformation {
  totalHeight: number;
  sections: SectionInfoExt[];
}

export interface ColumnScaleOptions
  extends Omit<SectionScaleOptions, "domain"> {
  unconformityHeight: number;
}

export function useCompositeScaledGroups(
  groups: SectionInfo[],
  opts: ColumnScaleOptions
): CompositeScaleInformation {
  return useMemo(() => {
    return buildSectionScaleInformation(groups, opts);
  }, [groups, Object.values(opts)]);
}

function buildSectionScaleInformation(
  sectionGroups: SectionInfo[],
  opts: ColumnScaleOptions
): CompositeScaleInformation {
  const { unconformityHeight, axisType = ColumnAxisType.AGE, ...rest } = opts;
  const sections: SectionInfoExt[] = [];

  let totalHeight = unconformityHeight / 2;
  for (const group of sectionGroups) {
    const { t_age, b_age, units } = group;
    let _range = null;
    // if t_age and b_age are set for a group, use them to define the range...
    if (t_age != null && b_age != null && axisType == ColumnAxisType.AGE) {
      _range = [b_age, t_age];
    }

    const scaleInfo = computeSectionHeight(units, {
      ...rest,
      axisType,
      domain: _range,
    });

    sections.push({
      ...group,
      scaleInfo: {
        ...scaleInfo,
        offset: totalHeight,
      },
    });
    totalHeight += scaleInfo.pixelHeight + unconformityHeight;
  }
  totalHeight += unconformityHeight / 2;
  return {
    totalHeight,
    sections,
  };
}

function computeSectionHeight(
  data: ExtUnit[],
  opts: SectionScaleOptions
): SectionScaleInfo {
  const { targetUnitHeight = 20, minPixelScale = 0.2, axisType } = opts;
  const domain = opts.domain ?? findSectionHeightRange(data, axisType);

  const dAge = Math.abs(domain[0] - domain[1]);

  let _pixelScale = opts.pixelScale;
  if (_pixelScale == null) {
    // 0.2 pixel per myr is the floor scale
    const targetHeight = targetUnitHeight * data.length;
    // 1 pixel per myr is the floor scale
    _pixelScale = Math.max(targetHeight / dAge, minPixelScale);
  }

  const height = dAge * _pixelScale;

  return {
    domain,
    pixelScale: _pixelScale,
    pixelHeight: height,
  };
}

function findSectionHeightRange(
  data: ExtUnit[],
  axisType: ColumnAxisType
): [number, number] {
  if (axisType === ColumnAxisType.AGE) {
    const t_age = Math.min(...data.map((d) => d.t_age));
    const b_age = Math.max(...data.map((d) => d.b_age));
    return [b_age, t_age];
  } else if (
    axisType == ColumnAxisType.DEPTH ||
    axisType == ColumnAxisType.ORDINAL
  ) {
    const t_pos = Math.min(...data.map((d) => d.t_pos));
    const b_pos = Math.max(...data.map((d) => d.b_pos));
    return [b_pos, t_pos];
  } else if (axisType == ColumnAxisType.HEIGHT) {
    const t_pos = Math.max(...data.map((d) => d.t_pos));
    const b_pos = Math.min(...data.map((d) => d.b_pos));
    return [b_pos, t_pos];
  }
}

export function createCompositeScale(
  sections: SectionInfoExt[],
  interpolateUnconformities: boolean = false
): (age: number) => number | null {
  return (age) => {
    /** Given an age, find the corresponding pixel position */
    // Iterate through the sections to find the correct one

    // Get surfaces at which scale breaks
    let lastSection = null;
    let scaleBreaks: [number, number][] = [];
    for (const section of sections) {
      const { pixelHeight, pixelScale, offset, domain } = section.scaleInfo;

      scaleBreaks.push([domain[1], offset]);
      scaleBreaks.push([domain[0], offset + pixelHeight]);
    }
    // Sort the scale breaks by age
    scaleBreaks.sort((a, b) => a[0] - b[0]);
    console.log(scaleBreaks);

    // Accumulate scale breaks and pixel height
    let pixelHeight = 0;
    let pixelScale = 0;
    let lastAge = null;
    for (const [age1, height] of scaleBreaks) {
      if (age <= age1) {
        if (lastAge != null) {
          pixelHeight += (age - lastAge) * pixelScale;
          return pixelHeight;
        }
        lastAge = age;
        pixelHeight = height;
      }
    }
  };
}
