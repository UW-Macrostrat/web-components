import { CompositeUnitsColumn, IUnit } from "./units";
import { ReactNode, useMemo } from "react";
import { AgeAxis, ColumnVerticalAxis } from "./age-axis";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import { ColumnAxisType, ColumnSVG } from "@macrostrat/column-components";
import { MacrostratColumnProvider } from "./index";
import hyper from "@macrostrat/hyper";
import styles from "./column.module.sass";
import { BaseUnit, UnitLong } from "@macrostrat/api-types";
import type { ExtUnit } from "./prepare-units/helpers";

const h = hyper.styled(styles);

export interface SectionInfo {
  section_id: number | number[];
  t_age: number;
  b_age: number;
  units: ExtUnit[];
}

export interface SectionSharedProps {
  data: BaseUnit[];
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
  timescaleLevels?: [number, number];
  /** A fixed pixel scale to use for the section (pixels per Myr) */
  pixelScale?: number;
  /** The target height of a constituent unit in pixels, for dynamic
   * scale generation */
  targetUnitHeight?: number;
  /** The minimum pixel scale to use for the section (pixels per Myr) */
  minPixelScale?: number;
}

export function Section(props: SectionSharedProps) {
  // Section with "squishy" time scale
  const {
    data,
    range: _range,
    pixelScale: _pixelScale,
    unitComponent,
    showLabels = true,
    targetUnitHeight = 20,
    width = 300,
    columnWidth = 150,
    unitComponentProps,
    showLabelColumn = true,
    axisType = ColumnAxisType.AGE,
    className,
    children,
    clipUnits = true,
    minPixelScale = 0.2,
    showTimescale = true,
    timescaleLevels,
  } = props;

  const range = useMemo(
    () => _range ?? findSectionHeightRange(data as UnitLong[], axisType),
    [_range, axisType]
  );

  const dAge = range[0] - range[1];

  const pixelScale = useMemo(() => {
    if (_pixelScale != null) return _pixelScale;
    const targetHeight = targetUnitHeight * data.length;
    // 1 pixel per myr is the floor scale
    return Math.max(targetHeight / dAge, minPixelScale);
  }, [_pixelScale, targetUnitHeight, data.length, dAge]);

  const height = useMemo(() => dAge * pixelScale, [dAge, pixelScale]);

  /** Ensure that we can arrange units into the maximum number
   * of columns defined by unitComponentProps, but that we don't
   * use more than necessary.
   */
  const _unitComponentProps = useMemo(() => {
    return {
      ...unitComponentProps,
      nColumns: Math.min(
        Math.max(...data.map((d) => d.column)) + 1,
        unitComponentProps?.nColumns ?? 2
      ),
      axisType,
    };
  }, [data, unitComponentProps, axisType]);

  let timescale = null;

  // Check whether we should show the timescale
  let _showTimescale = showTimescale;
  if (timescaleLevels !== null) {
    _showTimescale = true;
  }

  if (axisType == ColumnAxisType.AGE && _showTimescale) {
    timescale = h("div.timescale-container", { style: { marginTop: `10px` } }, [
      h(Timescale, {
        orientation: TimescaleOrientation.VERTICAL,
        length: height,
        levels: timescaleLevels ?? [2, 5],
        absoluteAgeScale: true,
        showAgeAxis: false,
        ageRange: range as [number, number],
      }),
    ]);
  }

  const style = {
    "--section-height": `${height}px`,
    "--section-width": `${columnWidth}px`,
  };

  return h(
    MacrostratColumnProvider,
    {
      divisions: data,
      range,
      pixelsPerMeter: pixelScale, // Actually pixels per myr,
      axisType,
    },
    [
      h("div.section", { className, style }, [
        h.if(axisType != ColumnAxisType.ORDINAL)(ColumnVerticalAxis, {
          width: 20,
          padding: 0,
          paddingV: 10,
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
              paddingV: 10,
              innerHeight: height,
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

interface SectionScaleOptions {
  axisType: ColumnAxisType;
  domain?: [number, number];
  pixelScale?: number;
  minPixelScale?: number;
  targetUnitHeight?: number;
}

/** Output of a section scale. For now, this assumes that the
 * mapping is linear, but it could be extended to support arbitrary
 * scale functions.
 */
interface SectionScaleInfo {
  domain: [number, number];
  pixelScale: number;
  pixelHeight: number;
  // TODO: add a function
}

function computeSectionHeight(
  units: ExtUnit[],
  opts: SectionScaleOptions
): SectionScaleInfo {
  const {
    targetUnitHeight = 20,
    minPixelScale = 0.2,
    axisType = ColumnAxisType.AGE,
  } = opts;

  const domain = opts.domain ?? findSectionHeightRange(units, axisType);

  const dAge = Math.abs(domain[0] - domain[1]);

  let _pixelScale = opts.pixelScale;
  if (_pixelScale == null) {
    // 0.2 pixel per myr is the floor scale
    _pixelScale = Math.max(targetUnitHeight / dAge, minPixelScale);
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
