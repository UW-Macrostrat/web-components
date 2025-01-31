import {
  ColumnLayoutContext,
  ColumnProvider,
  ColumnSVG,
} from "@macrostrat/column-components";
import { hyperStyled } from "@macrostrat/hyper";
import { Timescale, TimescaleOrientation } from "@macrostrat/timescale";
import { useDarkMode } from "@macrostrat/ui-components";
import classNames from "classnames";
import { group } from "d3-array";
import { RefObject, useContext, useMemo } from "react";
import { AgeAxis } from "./age-axis";
import styles from "./column.module.sass";
import {
  CompositeUnitsColumn,
  TrackedLabeledUnit,
  useUnitSelectionDispatch,
} from "./units";
import { IUnit } from "./units/types";
export * from "./units";
export * from "./age-axis";
import { ReactNode } from "react";

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
  children?: ReactNode;
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
    unitComponentProps,
    showLabelColumn = true,
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
    };
  }, [data, unitComponentProps]);

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

interface SectionInfo {
  section_id: number | number[];
  t_age: number;
  b_age: number;
  units: IUnit[];
}

function groupUnitsIntoSections(units: IUnit[]): SectionInfo[] {
  let groups = Array.from(group(units, (d) => d.section_id));
  return groups.map(([section_id, units]) => {
    const t_age = Math.min(...units.map((d) => d.t_age));
    const b_age = Math.max(...units.map((d) => d.b_age));
    return { section_id, t_age, b_age, units };
  });
}

function _mergeOverlappingSections(sections: SectionInfo[]): SectionInfo[] {
  /** Columns can have sections that overlap in time. Here, we merge overlapping
   * sections into a single section to correctly render gap-bound packages.
   */
  const [firstSection, ...rest] = sections;
  const newSections = [firstSection];
  for (const section of rest) {
    const lastSection = newSections[newSections.length - 1];
    if (
      lastSection.b_age < section.t_age ||
      lastSection.t_age > section.b_age
    ) {
      // No overlap, add the section as normal
      newSections.push(section);
      continue;
    }
    // Overlap, merge the sections
    lastSection.section_id = [
      ...ensureArray(lastSection.section_id),
      ...ensureArray(section.section_id),
    ];
    lastSection.units.push(...section.units);
    lastSection.b_age = Math.max(lastSection.b_age, section.b_age);
    lastSection.t_age = Math.min(lastSection.t_age, section.t_age);
  }
  return newSections;
}

function ensureArray<T>(x: T | T[]): T[] {
  if (Array.isArray(x)) {
    return x;
  }
  return [x];
}

function sectionClassName(section: SectionInfo) {
  return `section-${ensureArray(section.section_id).join("-")}`;
}

function Column(
  props: IColumnProps & {
    unconformityLabels: boolean;
    className?: string;
    mergeOverlappingSections?: boolean;
    showLabelColumn?: boolean;
    columnRef?: RefObject<HTMLDivElement>;
  }
) {
  const {
    data,
    unitComponent = UnitComponent,
    unconformityLabels = true,
    showLabels = true,
    width = 300,
    columnWidth = 150,
    className: baseClassName,
    showLabelColumn = true,
    mergeOverlappingSections = true,
    columnRef,
    children,
    ...rest
  } = props;

  const darkMode = useDarkMode();
  const sectionGroups = useMemo(() => {
    let res = groupUnitsIntoSections(data);
    if (mergeOverlappingSections) {
      res = _mergeOverlappingSections(res);
    }
    return res;
  }, [data, mergeOverlappingSections]);

  const className = classNames(baseClassName, {
    "dark-mode": darkMode?.isEnabled ?? false,
  });

  // Clear unit selection on click outside of units, if we have a dispatch function
  const dispatch = useUnitSelectionDispatch();

  return h(
    "div.column-container",
    {
      className,
      onClick(evt) {
        dispatch?.(null, null, evt);
      },
    },
    h("div.column", { ref: columnRef }, [
      h("div.age-axis-label", "Age (Ma)"),
      h(
        "div.main-column",
        sectionGroups.map((group, i) => {
          const { section_id: id, units: data } = group;
          const lastGroup = sectionGroups[i - 1];
          return h([
            h.if(unconformityLabels)(Unconformity, {
              upperUnits: lastGroup?.units,
              lowerUnits: data,
              style: { width: showLabels ? columnWidth : width },
            }),
            h(`div.section`, { className: sectionClassName(group) }, [
              h(Section, {
                data,
                unitComponent,
                showLabels,
                width,
                columnWidth,
                showLabelColumn,
                ...rest,
              }),
            ]),
          ]);
        })
      ),
      children,
    ])
  );
}

export * from "./helpers";
export * from "./map";
export { AgeAxis, Column, Section };
