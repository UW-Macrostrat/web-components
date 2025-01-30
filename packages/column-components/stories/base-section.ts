import h, { compose } from "@macrostrat/hyper";
import {
  ColumnProvider,
  ColumnSVG,
  ColumnAxis,
  LithologyBoxes,
  GeneralizedSectionColumn,
  GrainsizeLayoutProvider,
  GeologicPatternProvider,
  ColumnDivision,
  ColumnSurface,
} from "@macrostrat/column-components";
import { BaseUnit, ColumnSpec, UnitLong } from "@macrostrat/api-types";
import { IUnit } from "@macrostrat/column-views";
import {
  Timescale,
  TimescaleOrientation,
  IncreaseDirection,
} from "@macrostrat/timescale";
import "./measured-section.sass";

function patternPath(id) {
  return `../../../deps/geologic-patterns/assets/svg/${id}.svg`;
}

const patterns = import.meta.glob(
  "../../../deps/geologic-patterns/assets/svg/*.svg",
  { eager: true, query: "url" }
);

const resolvePattern = (id) => {
  const _id = patternPath(id);
  return patterns[_id]?.default;
};

export function PatternProvider({ children }) {
  return h(GeologicPatternProvider, { resolvePattern }, children);
}

interface IColumnProps {
  data: IUnit[];
  pixelScale?: number;
  range?: [number, number];
}

type UnitDivision = ColumnDivision & BaseUnit;

interface ColumnSurface {
  height: number;
}

function buildDivisions<T extends ColumnSurface>(
  surfaces: T[],
  range: [number, number]
): (BaseUnit & UnitDivision & T)[] {
  const units = surfaces.filter((d) => d.unit_id != null);
  return surfaces.map((surface, i) => {
    const { height, ...rest } = surface;
    const bottom = height;
    const nextSurface = surfaces[i + 1];
    const nextHeight = nextSurface != null ? nextSurface.height : range[1];
    const nextUnit = units[i + 1];
    const nextUnitHeight = nextUnit != null ? nextUnit.height : range[1];
    return {
      top: nextHeight,
      bottom,
      t_age: bottom,
      b_age: bottom + nextUnitHeight, // this is wrong,
      ...rest,
    };
  });
}

function _MeasuredSectionContainer(
  props: IColumnProps & {
    children: React.ReactNode;
    params: ColumnSpec;
    timescaleIntervals: Interval[] | null;
    timescaleLevels: number[];
    className?: string;
  }
) {
  // Section with "squishy" time scale
  const {
    data = [],
    range,
    children,
    params,
    showTimescale = true,
    timescaleProps = {},
    className,
    width = 250,
    showAxis = true,
  } = props;
  let { pixelScale = 1.3 } = props;

  let divisions = buildDivisions(data, range);

  return h("div.measured-section.column", { className }, [
    h(
      ColumnProvider,
      {
        divisions,
        range,
        pixelsPerMeter: pixelScale,
      },
      [
        h.if(showAxis)(
          ColumnSVG,
          {
            innerWidth: 0,
            padding: 30,
            paddingLeft: 40,
            paddingBottom: 30,
            paddingRight: 1,
          },
          h(ColumnAxis)
        ),
        h.if(showTimescale)(Timescale, {
          orientation: TimescaleOrientation.VERTICAL,
          increaseDirection: IncreaseDirection.UP_RIGHT,
          length: (range[1] - range[0]) * pixelScale,
          absoluteAgeScale: true,
          showAgeAxis: false,
          ageRange: range,
          ...timescaleProps,
        }),
        children,
      ]
    ),
  ]);
}

export const MeasuredSection = (
  props: IColumnProps & {
    children: React.ReactNode;
    params: ColumnSpec;
    timescaleIntervals: Interval[] | null;
    timescaleLevels: number[];
    className?: string;
  }
) => {
  // Section with "squishy" time scale
  const { children, className, width = 250, ...rest } = props;

  const grainsizeScaleStart = props.grainsizeScaleStart ?? 0.5 * width;
  // const unitData: UnitLong[] = useAPIResult("/units", params);
  // // let unitDivs = buildDivisions(
  // //   data.filter(d => d.unit_id != null),
  // //   range
  // // );
  // if (unitData != null) {
  //   divisions = mergeUnitData(unitData, divisions);
  // }

  return h(MeasuredSectionContainer, { className, children, ...rest }, [
    h(
      ColumnSVG,
      { innerWidth: 200, padding: 30, paddingLeft: 0, paddingBottom: 30 },
      [
        h(
          GrainsizeLayoutProvider,
          {
            width: 80,
            grainsizeScaleStart: 40,
          },
          [
            h(GeneralizedSectionColumn, [
              children,
              h(LithologyBoxes, { resolveID: (d) => d.pattern }),
            ]),
          ]
        ),
      ]
    ),
  ]);
};

export const MeasuredSectionContainer = compose(
  PatternProvider,
  _MeasuredSectionContainer
);
