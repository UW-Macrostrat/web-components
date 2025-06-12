import h from "@macrostrat/hyper";

import { BasicUnitComponent, Column } from "@macrostrat/column-views";
import { ColumnAxisType } from "@macrostrat/column-components";
import { FlexRow } from "@macrostrat/ui-components";
import { ColumnCreator } from "../src";

export default {
  title: "Column creator/Column creator",
  component: Column,
  description: "A column rendered using static units",
};

export function EmptyColumn() {
  return h("div", [
    h(Column, {
      units: [
        {
          unit_id: -1,
          empty: true,
          unit_name: "Empty Unit",
          t_pos: 200,
          b_pos: 0,
        },
      ],
      axisType: ColumnAxisType.HEIGHT,
      pixelScale: 0.8,
      allowUnitSelection: true,
      unitComponent: BasicUnitComponent,
    }),
  ]);
}

export function ColumnWithSingleUnit() {
  return h("div", [
    h(Column, {
      units: [
        {
          unit_id: -1,
          empty: true,
          unit_name: "Empty Unit",
          t_pos: 200,
          b_pos: 0,
        },
        {
          unit_id: 1,
          unit_name: "Single Unit",
          t_pos: 70,
          b_pos: 50,
          color: "#f0e68c",
        },
      ],
      axisType: ColumnAxisType.HEIGHT,
      pixelScale: 0.8,
      allowUnitSelection: true,
      unitComponent: BasicUnitComponent,
    }),
  ]);
}

const demoUnits = [
  {
    unit_id: 1,
    unit_name: "Unit A",
    t_pos: 100,
    b_pos: 0,
    color: "#f0e68c",
    patternID: "720",
  },
  {
    unit_id: 2,
    unit_name: "Unit B",
    t_pos: 200,
    b_pos: 100,
    color: "#708090",
    patternID: "620",
  },
];

export function BasicColumn() {
  return h("div", [
    h(Column, {
      units: demoUnits,
      axisType: ColumnAxisType.HEIGHT,
      pixelScale: 0.8,
      allowUnitSelection: true,
      unitComponent: BasicUnitComponent,
    }),
  ]);
}

const demoColumnCreatorData = {
  surfaces: [
    {
      id: "A",
      height: 0,
    },
    {
      id: "B",
      height: 100,
    },
    {
      id: "C",
      height: 200,
    },
  ],
  units: [
    {
      id: 1,
      name: "Unit A",
      b_surface: "A",
      t_surface: "B",
      color: "#f0e68c",
      pattern: "720",
    },
    {
      id: 2,
      name: "Unit B",
      b_surface: "B",
      t_surface: "C",
      color: "#708090",
      pattern: "620",
    },
  ],
};

export const ColumnCreatorStory = {
  name: "Column Creator",
  render() {
    return h(ColumnCreator, { data: demoColumnCreatorData });
  },
};

export const ColumnCreatorOverlappingUnits = {
  name: "Column Creator (overlapping units)",
  render() {
    return h(ColumnCreator, {
      data: {
        surfaces: [
          {
            id: "A",
            height: 0,
          },
          {
            id: "B",
            height: 100,
          },
          {
            id: "C",
            height: 200,
          },
          {
            id: "D",
            height: 420,
          },
          {
            id: "E",
            height: 480,
          },
          {
            id: "F",
            height: 550,
          },
        ],
        units: [
          {
            id: 1,
            name: "Basement",
            b_surface: "A",
            t_surface: "B",
            color: "#be8ad1",
            pattern: "720",
          },
          {
            id: 2,
            name: "Unit B",
            b_surface: "B",
            t_surface: "C",
            color: "#708090",
            pattern: "620",
          },
          {
            id: 3,
            name: "Dolostone",
            b_surface: "B",
            t_surface: "D",
            color: "#47fff9",
            pattern: "641",
          },
          {
            id: 4,
            name: "Cenozoic",
            b_surface: "D",
            t_surface: "E",
            color: "#cdb203",
            pattern: "608",
          },
          {
            id: 5,
            name: "Glacial drift",
            b_surface: "E",
            t_surface: "F",
            color: "#edf1a7",
            pattern: "684",
          },
        ],
      },
    });
  },
};
