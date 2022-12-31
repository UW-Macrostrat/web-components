import { hyperStyled } from "@macrostrat/hyper";
import { group } from "d3-array";
import {
  ColumnProvider,
  ColumnSVG,
  ColumnLayoutContext,
} from "@macrostrat/column-components";
import { useContext } from "react";
import { CompositeUnitsColumn } from "../../common/src/units";
import { IUnit } from "../../common/src/units/types";
import { AgeAxis } from "../../common/src";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
// import "@macrostrat/timescale/dist/timescale.css";
import { ICompositeUnitProps, TrackedLabeledUnit } from "../../common/src";
import { MacrostratColumnProvider } from "@macrostrat/api-views";
import styles from "./column.module.styl";

const h = hyperStyled(styles);

interface IColumnProps {
  data: IUnit[];
  pixelScale?: number;
  range?: [number, number];
  unitComponent: React.FunctionComponent<any>;
  unitComponentProps?: any;
}

const Section = (props: IColumnProps) => {
  // Section with "squishy" time scale
  const {
    data,
    range = [data[data.length - 1].b_age, data[0].t_age],
    unitComponent,
  } = props;
  let { pixelScale } = props;

  const dAge = range[0] - range[1];

  if (!pixelScale) {
    // Make up a pixel scale
    const targetHeight = 20 * data.length;
    pixelScale = Math.ceil(targetHeight / dAge);
  }

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
          length: dAge * pixelScale,
          levels: [2, 5],
          absoluteAgeScale: true,
          showAgeAxis: false,
          ageRange: range,
        }),
      ]),
      h(
        ColumnSVG,
        {
          width: 650,
          padding: 20,
          paddingLeft: 1,
          paddingV: 10,
        },
        h(CompositeUnitsColumn, {
          width: 450,
          columnWidth: 250,
          gutterWidth: 0,
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

const Column = (props: IColumnProps) => {
  const { data, unitComponent = UnitComponent } = props;

  let sectionGroups = Array.from(group(data, (d) => d.section_id));

  sectionGroups.sort((a, b) => a.t_age - b.t_age);

  return h(
    "div.column-container",
    h("div.column", [
      h("div.age-axis-label", "Age (Ma)"),
      h(
        "div.main-column",
        sectionGroups.map(([id, values]) => {
          return h(`div.section.section-${id}`, [
            h(Section, {
              data: values,
              unitComponent,
            }),
          ]);
        })
      ),
    ])
  );
};

export * from "./helpers";
export { Section, AgeAxis, Column };
