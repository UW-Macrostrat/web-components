import h from "@macrostrat/hyper";
import {
  ColumnDivision,
  ColumnSurface,
  ParameterIntervals,
} from "@macrostrat/column-components";
import { BaseUnit } from "@macrostrat/api-types";
import "./measured-section.sass";
import "../src/global-styles.scss";
import "../src/main.module.scss";
import zebraNappeIntervals from "./naukluft-intervals.json";
import namaIntervals from "./nama-intervals.json";
import "./zebra-nappe.sass";

import { MeasuredSection } from "./base-section";
import { defaultResolveID } from "@macrostrat/column-components";

type UnitDivision = ColumnDivision & BaseUnit;

interface ColumnSurface {
  height: number;
}

function applyPatterns<T extends ColumnSurface>(
  surfaces: T[],
  intervals: any[] = []
): (BaseUnit & UnitDivision & T)[] {
  return surfaces.map((surface, i) => {
    let matchingIntervals = intervals.filter((d) => d.bottom == surface.height);
    matchingIntervals.sort((a, b) => b.level - a.level);
    const color = matchingIntervals[0]?.color;

    return { ...surface, pattern: defaultResolveID(surface), color };
  });
}

export function ZebraRiverGroup() {
  const intervals = composeIntervals(zebraNappeIntervals, 700);
  const surfaces = applyPatterns(columnDataZN, intervals);
  console.log(surfaces);
  return h(
    MeasuredSection,
    {
      data: surfaces,
      timescaleProps: {
        intervals,
        levels: [0, 2],
        rootInterval: "zrg",
        borderColor: "#888",
      },
      range: [0, 700],
      pixelScale: 0.7,
    },
    h(ParameterIntervals, {
      parameter: "color",
      fillForInterval(param, interval) {
        return param;
      },
    })
  );
}

const columnDataNama: ColumnSurface[] = [
  {
    height: 0,
    pattern: "sandstone",
    grainsize: "c",
  },
  { height: 40, grainsize: "m", pattern: "limestone" },
  { height: 105, grainsize: "ms", pattern: 677 },
  { height: 155, grainsize: "m", pattern: "limestone" },
  { height: 200, grainsize: "c", pattern: "limestone" },
  { height: 220, grainsize: "ms", pattern: "shale" },
  {
    height: 280,
    pattern: "sandstone",
    grainsize: "f",
  },
  {
    height: 320,
    pattern: "shale",
    grainsize: "ms",
  },
];

export function NamaGroup() {
  const intervals = composeIntervals(namaIntervals, 400);
  const surfaces = applyPatterns(columnDataNama, intervals);
  return h(
    MeasuredSection,
    {
      data: surfaces,
      timescaleProps: {
        intervals,
        levels: [0, 2],
        rootInterval: "nama",
        borderColor: "#888",
      },
      range: [0, 400],
      pixelScale: 0.7,
    },
    h(ParameterIntervals, {
      parameter: "color",
      fillForInterval(param, interval) {
        return param;
      },
    })
  );
}

export default {
  title: "Column components/Zebra River Group stratigraphic column",
  component: ZebraRiverGroup,
} as ComponentMeta<typeof MeasuredSection>;

const columnDataZN: ColumnSurface[] = [
  {
    height: 0,
    pattern: "dolomite",
    grainsize: "ms",
  },
  { height: 80, grainsize: "c", pattern: "sandstone" },
  { height: 110, grainsize: "ms", pattern: "shale" },
  { height: 140, grainsize: "c", pattern: "sandstone" },
  { height: 150, grainsize: "ms", pattern: "dolomite" },
  { height: 190, grainsize: "m", pattern: "sandstone" },
  {
    height: 230,
    lithology: "dolomite",
    grainsize: "ms",
    pattern: "limestone",
  },
  {
    height: 280,
    lithology: "dolomite",
    grainsize: "c",
    pattern: 633,
  },
  {
    height: 290,
    grainsize: "ms",
    pattern: "shale",
  },
  {
    height: 320,
    grainsize: "c",
    pattern: "limestone",
  },
  {
    height: 330,
    grainsize: "ms",
    pattern: "shale",
  },
  {
    height: 370,
    grainsize: "c",
    pattern: "limestone",
  },
  {
    height: 390,
    lithology: "shale",
    grainsize: "ms",
    pattern: "shale",
  },
  {
    height: 470,
    pattern: "dolomite",
    grainsize: "c",
  },
  {
    height: 510,
    pattern: "limestone",
    grainsize: "s",
  },
  {
    height: 550,
    pattern: "dolomite",
    grainsize: "c",
  },
  {
    height: 600,
    pattern: "limestone",
    grainsize: "s",
  },
  {
    height: 650,
    pattern: 632,
    grainsize: "c",
  },
];

function composeIntervals(intervals, height) {
  return intervals.map((d) => {
    return {
      ...d,
      eag: d.bottom,
      lag: d.top,
      pid: d.parent,
      lvl: d.level - 2,
      oid: d.id,
      nam: d.name,
      col: d.color,
    };
  });
}
