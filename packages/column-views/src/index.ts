import { hyperStyled } from "@macrostrat/hyper";
import { group } from "d3-array";
import {
  ColumnProvider,
  ColumnSVG,
  ColumnLayoutContext,
} from "@macrostrat/column-components";
import { useContext, useMemo, useEffect } from "react";
import { CompositeUnitsColumn } from "./units";
import { IUnit } from "./units/types";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import { TrackedLabeledUnit } from "./units";
import styles from "./column.module.scss";
import { AgeAxis } from "./age-axis";
import { useDarkMode } from "@macrostrat/ui-components";
export * from "./units";
import classNames from "classnames";

import { ColumnAxisType } from "@macrostrat/column-components";

const h = hyperStyled(styles);

export function MacrostratColumnProvider(props) {
  // A column provider specialized the Macrostrat API
  return h(ColumnProvider, { axisType: ColumnAxisType.AGE, ...props });
}

interface IColumnProps {
  data: IUnit[];
  pixelScale?: number;
  range?: [number, number];
  unitComponent?: React.FunctionComponent<any>;
  unitComponentProps?: any;
  showLabels?: boolean;
  width?: number;
  columnWidth?: number;
  targetUnitHeight?: number;
}

const timescaleLevels = [2, 5];

const Section = (props: IColumnProps) => {
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
  } = props;

  const b_age = data[data.length - 1].b_age;
  const t_age = data[0].t_age;

  const range = useMemo(() => {
    if (_range == null) {
      return [b_age, t_age];
    }
    return _range;
  }, [_range, b_age, t_age]);

  const dAge = useMemo(() => range[0] - range[1], [range]);

  const pixelScale = useMemo(() => {
    if (_pixelScale != null) return _pixelScale;
    const targetHeight = targetUnitHeight * data.length;
    return Math.ceil(targetHeight / dAge);
  }, [_pixelScale, targetUnitHeight, data.length, dAge]);

  const height = useMemo(() => dAge * pixelScale, [dAge, pixelScale]);

  const unitComponentProps = useMemo(() => {
    return {
      nColumns: Math.max(...data.map((d) => d.column)) + 1,
    };
  }, [data]);

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
          levels: timescaleLevels,
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
          unitComponentProps,
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

  const ageGap = lowerUnits[0].t_age - upperUnits[upperUnits.length - 1].b_age;

  return h(
    "div.unconformity",
    { style },
    h("div.unconformity-text", `${ageGap.toFixed(1)} Ma`)
  );
}

function Column(
  props: IColumnProps & { unconformityLabels: boolean; className?: string }
) {
  const {
    data,
    unitComponent = UnitComponent,
    unconformityLabels = false,
    showLabels = true,
    width = 300,
    columnWidth = 150,
    className: baseClassName,
    ...rest
  } = props;

  const darkMode = useDarkMode();

  let sectionGroups = useMemo(() => {
    let groups = Array.from(group(data, (d) => d.section_id));
    groups.sort((a, b) => a.t_age - b.t_age);
    return groups;
  }, [data]);

  const className = classNames(baseClassName, {
    "dark-mode": darkMode?.isEnabled ?? false,
  });

  return h(
    "div.column-container",
    { className },
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
}

export * from "./helpers";
export { Section, AgeAxis, Column };
export * from "./map";
