import "@macrostrat/style-system";
import { MergeSectionsMode, UnitComponent } from "../..";
import { Meta } from "@storybook/react-vite";

import h from "./stories.module.sass";
import { CorrelationChart } from "../main";
import { BaseUnit } from "@macrostrat/api-types";
import { useGeologicPattern } from "@macrostrat/column-components";

export default {
  title: "Column views/Correlation chart",
  component: CorrelationChart,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Correlation chart for Macrostrat columns",
      },
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
  },
  args: {},
} as Meta<typeof CorrelationChart>;

const nosib = {
  b_age: 900,
  t_age: 800,
  name: "Nosib",
  color: "#ffd4ba",
};

const namUnits: (BaseUnit | BaseUnit[])[] = [
  [
    nosib,
    { b_age: 746, t_age: 720, name: "Chuos", color: "#d0b4ff" },
    {
      b_age: 720,
      t_age: 600,
      name: "Otavi",
      color: "dodgerblue",
    },
  ],
  [
    nosib,
    {
      b_age: 740,
      t_age: 600,
      name: "Swakop",
      color: "#aaa",
    },
  ],
  [
    nosib,
    {
      b_age: 670,
      t_age: 580,
      name: "Witvlei",
      color: "#fffc4e",
    },
  ],
  [
    {
      b_age: 610,
      t_age: 575,
      name: "Zebra Series",
      color: "#fdbcf0",
    },
    {
      b_age: 660,
      t_age: 610,
      name: "Naukluft complex",
      color: "#fdbcbc",
    },
  ],
  {
    b_age: 550,
    t_age: 520,
    name: "Nama",
    color: "#baf1a7",
  },
  // {
  //   unit_id: 0,
  //   b_age: 900,
  //   t_age: 0,
  //   unit_name: "",
  //   column: 8,
  // },
];

export function NamibiaCorrelationChart() {
  return h(
    "div",
    {
      style: {
        "--column-unit-font-size": "14px",
        "--column-unit-font-style": "bold",
        "--column-text-color": "white",
      },
    },
    [
      h(CorrelationChart, {
        id: 432,
        data: namUnits.map((u, i) => {
          let units: any = null;
          if (Array.isArray(u)) {
            units = u.map((u) => buildUnit(u, i));
          } else {
            units = [buildUnit(u, i)];
          }
          return {
            columnID: i,
            units,
          };
        }),
        columnSpacing: 10,
        t_age: 450,
        b_age: 850,
        //width: 400,
        //columnWidth: 400,
        pixelScale: 2,
        //showLabelColumn: false,
        mergeSections: MergeSectionsMode.ALL,
        unitComponent: ProvidedColorUnitComponent,
      }),
    ],
  );
}

function buildUnit(unit, i) {
  return {
    unit_id: i,
    col_id: i,
    ...unit,
    unit_name: unit.name,
  };
}

function ProvidedColorUnitComponent(props) {
  /** A unit component that is colored by its own properties. */

  const fill = useGeologicPattern(props.division.patternID);

  return h(UnitComponent, {
    fill,
    backgroundColor: props.division.color ?? null,
    ...props,
  });
}
