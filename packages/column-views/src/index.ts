import { hyperStyled } from "@macrostrat/hyper";
import { group } from "d3-array";
import {
  ColumnProvider,
  ColumnSVG,
  ColumnLayoutContext,
} from "@macrostrat/column-components";
import { useContext } from "react";
import { CompositeUnitsColumn } from "./units";
import { IUnit } from "./units/types";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
// import "@macrostrat/timescale/dist/timescale.css";
import { ICompositeUnitProps, TrackedLabeledUnit } from "./units";
import styles from "./column.module.styl";
import { AgeAxis } from "@macrostrat/concept-app-helpers";
export * from "./units";

import { ColumnAxisType } from "@macrostrat/column-components";

export function MacrostratColumnProvider(props) {
  // A column provider specialized the Macrostrat API
  return h(ColumnProvider, { axisType: ColumnAxisType.AGE, ...props });
}

const h = hyperStyled(styles);

interface IColumnProps {
  data: IUnit[];
  pixelScale?: number;
  range?: [number, number];
  unitComponent: React.FunctionComponent<any>;
  unitComponentProps?: any;
  showLabels?: boolean;
  width?: number;
  columnWidth?: number;
  targetUnitHeight?: number;
}

const Section = (props: IColumnProps) => {
  // Section with "squishy" time scale
  const {
    data,
    range = [data[data.length - 1].b_age, data[0].t_age],
    unitComponent,
    showLabels = true,
    targetUnitHeight = 20,
    width = 300,
    columnWidth = 150,
  } = props;
  let { pixelScale } = props;

  const dAge = range[0] - range[1];

  if (!pixelScale) {
    // Make up a pixel scale
    const targetHeight = targetUnitHeight * data.length;
    pixelScale = Math.ceil(targetHeight / dAge);
  }

  const height = dAge * pixelScale;

  return h(
    MacrostratColumnProvider,
    {
      divisions: data,
      range,
      pixelsPerMeter: pixelScale, // Actually pixels per myr
    },
    [
      h(AgeAxis, {
        width: 20,
        padding: 0,
        paddingV: 10,
        showLabel: false,
      }),
      h("div.timescale-container", { style: { marginTop: `10px` } }, [
        h(Timescale, {
          orientation: TimescaleOrientation.VERTICAL,
          length: height,
          levels: [2, 5],
          absoluteAgeScale: true,
          showAgeAxis: false,
          ageRange: range,
        }),
      ]),
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
          width: showLabels ? width : columnWidth,
          columnWidth,
          gutterWidth: 5,
          showLabels,
          unitComponent,
          unitComponentProps: {
            nColumns: Math.max(...data.map((d) => d.column)) + 1,
          },
        })
      ),
    ]
  );
};

export function UnitComponent({ division, nColumns = 2, ...rest }) {
  const { width } = useContext(ColumnLayoutContext);

  //const nCols = Math.min(nColumns, division.overlappingUnits.length+1)
  //console.log(division);
  return h(TrackedLabeledUnit, {
    division,
    ...rest,
    width: division.overlappingUnits.length > 0 ? width / nColumns : width,
    x: (division.column * width) / nColumns,
  });
}

function Unconformity({ upperUnits = [], lowerUnits = [], style }) {
  if (upperUnits.length == 0 || lowerUnits.length == 0) {
    return null;
  }
  console.log(upperUnits, lowerUnits);

  const ageGap = lowerUnits[0].t_age - upperUnits[upperUnits.length - 1].b_age;

  return h(
    "div.unconformity",
    { style },
    h("div.unconformity-text", `${ageGap.toFixed(1)} Ma`)
  );
}

const Column = (props: IColumnProps & { unconformityLabels: boolean }) => {
  const {
    data,
    unitComponent = UnitComponent,
    unconformityLabels = false,
    showLabels = true,
    width = 300,
    columnWidth = 150,
    ...rest
  } = props;

  let sectionGroups = Array.from(group(data, (d) => d.section_id));

  sectionGroups.sort((a, b) => a.t_age - b.t_age);

  return h(
    "div.column-container",
    h("div.column", [
      h("div.age-axis-label", "Age (Ma)"),
      h(
        "div.main-column",
        sectionGroups.map(([id, data], i) => {
          const lastGroup = sectionGroups[i - 1]?.[1];
          return h([
            h.if(unconformityLabels)(Unconformity, {
              upperUnits: lastGroup,
              lowerUnits: data,
              style: { width: showLabels ? columnWidth : width },
            }),
            h(`div.section.section-${id}`, [
              h(Section, {
                data,
                unitComponent,
                showLabels,
                width,
                columnWidth,
                ...rest,
              }),
            ]),
          ]);
        })
      ),
    ])
  );
};

export * from "./helpers";
export { Section, AgeAxis, Column };
