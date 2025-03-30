import {
  ColumnAxisType,
  ColumnLayoutContext,
  ColumnProvider,
} from "@macrostrat/column-components";
import { hyperStyled } from "@macrostrat/hyper";
import { useDarkMode, useInDarkMode } from "@macrostrat/ui-components";
import classNames from "classnames";
import { createRef, RefObject, useContext, useMemo } from "react";
import styles from "./column.module.sass";
import {
  getMixedUnitColor,
  TrackedLabeledUnit,
  UnitKeyboardNavigation,
  UnitSelectionProvider,
  useUnitSelectionDispatch,
} from "./units";
import { SectionInfo } from "./section";
import { UnitSelectionPopover } from "./selection-popover";
import { MacrostratUnitsProvider } from "./store";
import { IColumnProps, Section } from "./section";
import {
  _mergeOverlappingSections,
  ensureArray,
  groupUnitsIntoSections,
} from "./helpers";
import { useLithologies } from "./data-provider";
import { VerticalAxisLabel } from "./age-axis";

const h = hyperStyled(styles);

export function UnitComponent({ division, nColumns = 2, ...rest }) {
  const { width } = useContext(ColumnLayoutContext);

  const nOverlappingUnits = division.overlappingUnits?.length ?? 0;
  const columnIx = division.column ?? 0;

  //const nCols = Math.min(nColumns, division.overlappingUnits.length+1)
  //console.log(division);
  return h(TrackedLabeledUnit, {
    division,
    ...rest,
    width: nOverlappingUnits > 0 ? width / nColumns : width,
    x: (columnIx * width) / nColumns,
  });
}

export function ColoredUnitComponent(props) {
  /** A unit component that is colored using a mixture of lithologies.
   * This is a separate component because it depends on more providers/contexts to determine coloring. */
  const lithMap = useLithologies();
  const inDarkMode = useInDarkMode();
  return h(UnitComponent, {
    ...props,
    backgroundColor: getMixedUnitColor(props.division, lithMap, inDarkMode),
  });
}

function Unconformity({ upperUnits = [], lowerUnits = [], style }) {
  if (upperUnits.length == 0 || lowerUnits.length == 0) {
    return null;
  }

  const ageGap = lowerUnits[0].t_age - upperUnits[upperUnits.length - 1].b_age;

  return h("div.unconformity", { style }, [
    h("div.unconformity-text", `${ageGap.toFixed(1)} Ma`),
  ]);
}

function sectionClassName(section: SectionInfo) {
  return `section-${ensureArray(section.section_id).join("-")}`;
}

export interface ColumnProps extends IColumnProps {
  unconformityLabels?: boolean;
  className?: string;
  mergeOverlappingSections?: boolean;
  showLabelColumn?: boolean;
  columnRef?: RefObject<HTMLElement>;
  keyboardNavigation?: boolean;
  showUnitPopover?: boolean;
  t_age?: number;
  b_age?: number;
  axisType?: ColumnAxisType;
}

export function Column(props: ColumnProps) {
  const { showUnitPopover = false, ...rest } = props;
  const ref = createRef<HTMLElement>();
  // Selected item position

  return h(
    UnitSelectionProvider,
    { columnRef: ref },
    h(
      _Column,
      { ...rest, columnRef: ref },
      h.if(showUnitPopover)(UnitSelectionPopover)
    )
  );
}

function _Column(props: Omit<ColumnProps, "showUnitPopover">) {
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
    keyboardNavigation = false,
    axisType = ColumnAxisType.AGE,
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

  let axisLabel: string | null = "Age";
  let axisUnit = "Ma";
  if (axisType == ColumnAxisType.DEPTH) {
    axisLabel = "Depth";
    axisUnit = "m";
  } else if (axisType == ColumnAxisType.HEIGHT) {
    axisLabel = "Height";
    axisUnit = "m";
  } else if (axisType == ColumnAxisType.ORDINAL) {
    axisLabel = null;
  }

  return h(
    "div.column-container",
    {
      className,
      // TODO: this could probably be done using the columnRef
      onClick(evt) {
        dispatch?.(null, null, evt as any);
      },
    },
    h(MacrostratUnitsProvider, { units: data }, [
      h("div.column", { ref: columnRef }, [
        h.if(axisLabel != null)(VerticalAxisLabel, {
          label: axisLabel,
          unit: axisUnit,
        }),
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
                  axisType,
                  ...rest,
                }),
              ]),
            ]);
          })
        ),
        h.if(keyboardNavigation)(UnitKeyboardNavigation, { units: data }),
        children,
      ]),
    ])
  );
}
