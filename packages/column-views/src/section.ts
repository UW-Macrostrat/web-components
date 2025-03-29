import { CompositeUnitsColumn, IUnit } from "./units";
import { ReactNode, useMemo } from "react";
import { AgeAxis, ColumnVerticalAxis } from "./age-axis";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import { ColumnAxisType, ColumnSVG } from "@macrostrat/column-components";
import { MacrostratColumnProvider } from "./index";
import hyper from "@macrostrat/hyper";
import styles from "./column.module.sass";
import { UnitLong } from "@macrostrat/api-types";

const h = hyper.styled(styles);

export interface SectionInfo {
  section_id: number | number[];
  t_age: number;
  b_age: number;
  units: IUnit[];
}

export interface IColumnProps {
  data: IUnit[];
  pixelScale?: number;
  range?: [number, number];
  unitComponent?: React.FunctionComponent<any>;
  unitComponentProps?: any;
  showLabels?: boolean;
  width?: number;
  columnWidth?: number;
  targetUnitHeight?: number;
  children?: ReactNode;
  showLabelColumn?: boolean;
  axisType?: ColumnAxisType;
}

export function Section(props: IColumnProps) {
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
  } = props;

  const range = useMemo(
    () => _range ?? findColumnRange(data as UnitLong[], axisType),
    [_range, axisType]
  );

  const dAge = range[0] - range[1];

  const pixelScale = useMemo(() => {
    if (_pixelScale != null) return _pixelScale;
    const targetHeight = targetUnitHeight * data.length;
    return Math.ceil(targetHeight / dAge);
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

  if (axisType == ColumnAxisType.AGE) {
    timescale = h("div.timescale-container", { style: { marginTop: `10px` } }, [
      h(Timescale, {
        orientation: TimescaleOrientation.VERTICAL,
        length: height,
        levels: timescaleLevels as [number, number],
        absoluteAgeScale: true,
        showAgeAxis: false,
        ageRange: range as [number, number],
      }),
    ]);
  }

  return h(
    MacrostratColumnProvider,
    {
      divisions: data,
      range,
      pixelsPerMeter: pixelScale, // Actually pixels per myr,
      axisType,
    },
    [
      h(ColumnVerticalAxis, {
        width: 20,
        padding: 0,
        paddingV: 10,
        showLabel: false,
      }),
      timescale,
      h(
        ColumnSVG,
        {
          innerWidth: showLabels ? width : columnWidth,
          paddingRight: 1,
          paddingLeft: 1,
          paddingV: 10,
          innerHeight: height,
        },
        h(CompositeUnitsColumn, {
          showLabelColumn: showLabelColumn,
          width: showLabels ? width : columnWidth,
          columnWidth,
          gutterWidth: 5,
          showLabels,
          unitComponent,
          unitComponentProps: _unitComponentProps,
        })
      ),
    ]
  );
}

function findColumnRange(data: UnitLong[], axisType: ColumnAxisType) {
  if (axisType === ColumnAxisType.AGE) {
    const t_age = Math.min(...data.map((d) => d.t_age));
    const b_age = Math.max(...data.map((d) => d.b_age));
    return [b_age, t_age];
  } else if (axisType == ColumnAxisType.DEPTH) {
    const t_pos = Math.min(...data.map((d) => d.t_pos));
    const b_pos = Math.max(...data.map((d) => d.b_pos));
    return [b_pos, t_pos];
  } else if (axisType == ColumnAxisType.HEIGHT) {
    const t_pos = Math.max(...data.map((d) => d.t_pos));
    const b_pos = Math.min(...data.map((d) => d.b_pos));
    return [b_pos, t_pos];
  }
}

const timescaleLevels = [2, 5];
