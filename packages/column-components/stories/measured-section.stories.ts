import h from "@macrostrat/hyper";
import { ColumnDivision, ColumnSurface } from "@macrostrat/column-components";
import { BaseUnit } from "@macrostrat/api-types";
import { IUnit } from "@macrostrat/column-views";
import "./measured-section.sass";
import "../src/global-styles.scss";
import "../src/main.module.scss";

import { MeasuredSection } from "./base-section";

type UnitDivision = ColumnDivision & BaseUnit;

interface ColumnSurface {
  height: number;
}

const columnData: ColumnSurface[] = [
  {
    height: 0,
    pattern: "sandstone",
    grainsize: "ms",
    unit_id: 41216,
  },
  { height: 97, grainsize: "f", pattern: "limestone" },
  { height: 101, grainsize: "ms", pattern: "sandstone" },
  { height: 144, grainsize: "f", pattern: "limestone" },
  { height: 154, grainsize: "ms", pattern: "sandstone" },
  { height: 180, grainsize: "c", pattern: 606 },
  {
    height: 182,
    lithology: "limestone",
    grainsize: "m",
    pattern: "limestone",
    unit_id: 41217,
  },
  {
    height: 192,
    grainsize: "p",
    pattern: "limestone",
  },
  {
    height: 194,
    grainsize: "c",
    pattern: "limestone",
  },
  {
    height: 196,
    grainsize: "m",
    pattern: "limestone",
  },
  {
    height: 320,
    lithology: "shale",
    grainsize: "ms",
    pattern: "shale",
    unit_id: 41218,
  },
];

const patternIndex = {
  sandstone: 607,
  limestone: 627,
  shale: 620,
};

function applyPatterns<T extends ColumnSurface>(
  surfaces: T[]
): (BaseUnit & UnitDivision & T)[] {
  return surfaces.map((surface, i) => {
    const { pattern, ...rest } = surface;
    return {
      lithology: pattern,
      pattern: `${patternIndex[pattern] ?? pattern}`,
      ...rest,
    };
  });
}

type HasUnitID = { unit_id: number };
function mergeUnitData<A extends HasUnitID, B extends HasUnitID>(
  sourceUnits: A[],
  result: B[]
): (A & B)[] {
  return result.map((d) => {
    const foundMatch = sourceUnits.find((u) => u.unit_id === d.unit_id);
    return { ...foundMatch, ...d };
  });
}

const height = 341.3;

const intervals: Interval[] = [
  {
    lvl: 0,
    eag: 0,
    lag: height,
    oid: 0,
    nam: "Rackla Group",
    col: "#aaa",
  },
  {
    lvl: 1,
    eag: 182,
    lag: height,
    pid: 0,
    oid: 1,
    nam: "Blueflower",
    col: "dodgerblue",
  },
  {
    nam: "Gametrail",
    lvl: 1,
    pid: 0,
    oid: 2,
    eag: 0,
    lag: 182,

    col: "#c0ddc6",
  },
];

export function withTimescale() {
  return h(MeasuredSection, {
    data: applyPatterns(columnData),
    timescaleIntervals: intervals,
    range: [0, height],
  });
}

export default {
  title: "Column components/Measured section",
  component: MeasuredSection,
  args: {
    timescaleIntervals: intervals,
    data: columnData,
    range: [0, height],
  },
} as ComponentMeta<typeof MeasuredSection>;

export function WithoutTimescale() {
  return h(MeasuredSection, {
    data: applyPatterns(columnData),
    timescaleIntervals: null,
    range: [0, height],
  });
}

const columnDataWithIntervals: ColumnSurface[] = [
  {
    height: 0,
    pattern: "sandstone",
    grainsize: "ms",
    intervals: [
      {
        nam: "Rackla Group",
        col: "#aaa",
        lvl: 0,
      },
      {
        lvl: 1,
        eag: 0,
        lag: height - 182,
        nam: "Blueflower",
        col: "dodgerblue",
      },
    ],
  },
  { height: 97, grainsize: "f", pattern: "limestone" },
  { height: 101, grainsize: "ms", pattern: "sandstone" },
  { height: 144, grainsize: "f", pattern: "limestone" },
  { height: 154, grainsize: "ms", pattern: "sandstone" },
  { height: 180, grainsize: "c", pattern: 606 },
  {
    height: 182,
    lithology: "limestone",
    grainsize: "m",
    pattern: "limestone",
  },
  {
    height: 192,
    grainsize: "p",
    pattern: "limestone",
  },
  {
    height: 194,
    grainsize: "c",
    pattern: "limestone",
  },
  {
    height: 196,
    grainsize: "m",
    pattern: "limestone",
  },
  {
    height: 320,
    lithology: "shale",
    grainsize: "ms",
    pattern: "shale",
  },
];

function extractIntervals(unitData: any[], rootItem, range = [0, 1]) {
  let intervals = [];
  // if (rootItem == null) {
  //   rootItem = unitData[0]?.intervals?.find((d) => {
  //     const level = d.lvl ?? 0;
  //     return level == 0;
  //   });
  // }
  for (const d of unitData) {
    if (d.intervals != null) {
      intervals.push(d.intervals);
    }
  }

  return intervals;
}

// export function WithIntegratedIntervals() {
//   const range = [0, height];
//   const intervals = extractIntervals(columnDataWithIntervals, null, range);
//   console.log(intervals);
//   return h(MeasuredSection, {
//     data: columnDataWithIntervals,
//     timescaleIntervals: intervals,
//     range,
//   });
// }

const columnDataZN: ColumnSurface[] = [
  {
    height: 0,
    pattern: "limestone",
    grainsize: "ms",
  },
  { height: 100, grainsize: "c", pattern: "sandstone" },
  { height: 120, grainsize: "ms", pattern: "shale" },
  { height: 180, grainsize: "c", pattern: "sandstone" },
  { height: 200, grainsize: "ms", pattern: "limestone" },
  { height: 220, grainsize: "m", pattern: 606 },
  {
    height: 240,
    lithology: "dolomite",
    grainsize: "ms",
    pattern: "limestone",
  },
  {
    height: 192,
    grainsize: "p",
    pattern: "limestone",
  },
  {
    height: 194,
    grainsize: "c",
    pattern: "limestone",
  },
  {
    height: 196,
    grainsize: "m",
    pattern: "limestone",
  },
  {
    height: 320,
    lithology: "shale",
    grainsize: "ms",
    pattern: "shale",
  },
];

const intervalsZN: Interval[] = [
  {
    lvl: 0,
    top: 700,
    bottom: 0,
    oid: 0,
    nam: "Zebra River Group",
    col: "#aaa",
  },
  {
    lvl: 1,
    bottom: 0,
    top: 100,
    pid: 0,
    oid: 1,
    nam: "Neuras",
    col: "dodgerblue",
  },
  {
    lvl: 1,
    bottom: 100,
    top: 200,
    pid: 0,
    oid: 1,
    nam: "Ubisis",
    col: "blue",
  },
  {
    lvl: 1,
    bottom: 200,
    top: 300,
    pid: 0,
    oid: 3,
    nam: "Tsams",
    col: "blue",
  },
  {
    lvl: 2,
    bottom: 200,
    top: 220,
    pid: 3,
    oid: 4,
    nam: "Lower Tsams",
    col: "blue",
  },
  {
    lvl: 2,
    bottom: 220,
    top: 250,
    pid: 3,
    oid: 4,
    nam: "Middle Tsams",
    col: "blue",
  },
  {
    lvl: 1,
    bottom: 300,
    top: 450,
    pid: 0,
    oid: 1,
    nam: "Lemoenputs",
    col: "blue",
  },
  {
    lvl: 1,
    bottom: 450,
    top: 600,
    pid: 0,
    oid: 1,
    nam: "Onis",
    col: "blue",
  },
  {
    lvl: 1,
    bottom: 600,
    top: 700,
    pid: 0,
    oid: 1,
    nam: "Tafel",
    col: "blue",
  },
];

function composeIntervals(intervals, height) {
  return intervals.map((d) => {
    return {
      ...d,
      eag: d.bottom,
      lag: d.top,
    };
  });
}

export function ZebraNappe() {
  return h(MeasuredSection, {
    data: applyPatterns(columnDataZN),
    timescaleIntervals: composeIntervals(intervalsZN, 700),
    timescaleLevels: [0, 1, 2],
    range: [0, 700],
    pixelScale: 0.7,
  });
}
