import {
  ColumnAxisType,
  ColumnLayoutContext,
  ColumnProvider,
} from "@macrostrat/column-components";
import { hyperStyled } from "@macrostrat/hyper";
import { useDarkMode } from "@macrostrat/ui-components";
import classNames from "classnames";
import { createRef, RefObject, useContext, useMemo, useState } from "react";
import styles from "./column.module.sass";
import {
  TrackedLabeledUnit,
  UnitKeyboardNavigation,
  UnitSelectionProvider,
  useUnitSelectionDispatch,
} from "./units";
import { SectionInfo } from "./section";
import { RectBounds } from "./units/boxes";
import { UnitSelectionPopover } from "./selection-popover";
import { MacrostratUnitsProvider } from "./store";
import { IColumnProps, Section } from "./section";
import {
  _mergeOverlappingSections,
  ensureArray,
  groupUnitsIntoSections,
} from "./helpers";

export * from "./units";
export * from "./age-axis";
export * from "./carbon-isotopes";
export * from "./providers";
export * from "./helpers";
export * from "./map";

const h = hyperStyled(styles);

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
  columnRef?: RefObject<HTMLDivElement>;
  keyboardNavigation?: boolean;
  showUnitPopover?: boolean;
  t_age?: number;
  b_age?: number;
}

export function Column(props: ColumnProps) {
  const { showUnitPopover = false, ...rest } = props;
  const ref = createRef<HTMLElement>();
  // Selected item position
  const [position, setPosition] = useState<RectBounds | null>(null);

  if (!showUnitPopover) {
    return h(_Column, rest);
  }

  return h(
    UnitSelectionProvider,
    {
      onUnitSelected: (unit, target: SVGElement | HTMLElement | null) => {
        if (!showUnitPopover) return;

        if (unit == null) {
          setPosition(null);
          return;
        }
        const el: HTMLElement = ref.current;
        if (el == null || target == null) return;
        const rect = el.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        setPosition({
          x: targetRect.left - rect.left,
          y: targetRect.top - rect.top,
          width: targetRect.width,
          height: targetRect.height,
        });
      },
    },
    h(
      _Column,
      { ...rest, columnRef: ref },
      h(UnitSelectionPopover, { position })
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
    h(MacrostratUnitsProvider, { units: data }, [
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
        h.if(keyboardNavigation)(UnitKeyboardNavigation, { units: data }),
        children,
      ]),
    ])
  );
}
