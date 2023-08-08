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
    timescaleProps: { intervals },
    range: [0, height],
  });
}

export default {
  title: "Column components/Measured section",
  component: MeasuredSection,
  args: {
    timescaleProps: { intervals },
    data: columnData,
    range: [0, height],
  },
} as ComponentMeta<typeof MeasuredSection>;

export function WithoutTimescale() {
  return h(MeasuredSection, {
    data: applyPatterns(columnData),
    showTimescale: false,
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
