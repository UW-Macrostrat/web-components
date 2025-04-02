import { ColumnAxisType } from "@macrostrat/column-components";
import { hyperStyled } from "@macrostrat/hyper";
import { useDarkMode } from "@macrostrat/ui-components";
import classNames from "classnames";
import { RefObject, useMemo, useRef } from "react";
import styles from "./column.module.sass";
import {
  UnitSelectionProvider,
  UnitComponent,
  UnitKeyboardNavigation,
  useUnitSelectionDispatch,
} from "./units";

import {
  ColumnHeightScaleOptions,
  SectionInfoExt,
} from "./prepare-units/composite-scale";
import {} from "./units";
import { UnitSelectionPopover } from "./selection-popover";
import { MacrostratUnitsProvider } from "./store";
import { SectionSharedProps, Section } from "./section";
import { ColumnAgeAxis } from "./age-axis";
import { MergeSectionsMode, usePreparedColumnUnits } from "./prepare-units";
import { VerticalAxisLabel } from "./age-axis";
import { BaseUnit } from "@macrostrat/api-types";
import { ExtUnit } from "./prepare-units/helpers";

const h = hyperStyled(styles);

interface BaseColumnProps extends SectionSharedProps, ColumnHeightScaleOptions {
  unconformityLabels?: boolean;
  className?: string;
  mergeSections?: MergeSectionsMode;
  showLabelColumn?: boolean;
  keyboardNavigation?: boolean;
  t_age?: number;
  b_age?: number;
  showLabels?: boolean;
  units: BaseUnit[];
  maxInternalColumns?: number;
  // Unconformity height in pixels
  unconformityHeight?: number;
}

export interface ColumnProps extends BaseColumnProps {
  showUnitPopover?: boolean;
  selectedUnit?: number | null;
  onUnitSelected?: (unitID: number | null, unit: any) => void;
}

export function Column(props: ColumnProps) {
  const {
    showUnitPopover = false,
    keyboardNavigation = false,
    mergeSections,
    onUnitSelected,
    selectedUnit,
    children,
    units: rawUnits,
    axisType,
    t_age,
    b_age,
    unconformityHeight = 30,
    targetUnitHeight = 20,
    pixelScale,
    minPixelScale = 0.2,
    minSectionHeight = 30,
    collapseSmallUnconformities = true,
    ...rest
  } = props;
  const ref = useRef<HTMLElement>();
  // Selected item position

  const { sections, units, totalHeight } = usePreparedColumnUnits(rawUnits, {
    axisType,
    t_age,
    b_age,
    mergeSections,
    targetUnitHeight,
    unconformityHeight,
    pixelScale,
    minPixelScale,
    minSectionHeight,
    collapseSmallUnconformities,
  });

  return h(
    UnitSelectionProvider,
    { columnRef: ref, onUnitSelected, selectedUnit, units },
    h(
      ColumnInner,
      {
        columnRef: ref,
        unconformityHeight,
        units,
        axisType,
        sections,
        totalHeight,
        t_age,
        b_age,
        ...rest,
      },
      [
        children,
        h.if(showUnitPopover)(UnitSelectionPopover),
        h.if(keyboardNavigation)(UnitKeyboardNavigation, { units }),
      ]
    )
  );
}

interface ColumnInnerProps extends BaseColumnProps {
  sections: SectionInfoExt[];
  unconformityHeight: number;
  totalHeight: number;
  columnRef: RefObject<HTMLElement>;
  units: ExtUnit[];
}

function ColumnInner(props: ColumnInnerProps) {
  const {
    units,
    sections,
    totalHeight,
    unitComponent = UnitComponent,
    unconformityHeight,
    unconformityLabels = true,
    showLabels = true,
    width = 300,
    columnWidth = 150,
    className: baseClassName,
    showLabelColumn = true,
    axisType = ColumnAxisType.AGE,
    columnRef,
    clipUnits = false,
    children,
    ...rest
  } = props;

  const darkMode = useDarkMode();

  const className = classNames(baseClassName, {
    "dark-mode": darkMode?.isEnabled ?? false,
  });

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
    h(MacrostratUnitsProvider, { units, sections, totalHeight }, [
      h("div.column", { ref: columnRef }, [
        h.if(axisLabel != null)(VerticalAxisLabel, {
          label: axisLabel,
          unit: axisUnit,
        }),
        h.if(axisType != ColumnAxisType.ORDINAL)(
          "div.age-axis-column",
          sections.map((group, i) => {
            const { units, scaleInfo, section_id } = group;

            const key = `section-${section_id}`;

            return h(ColumnAgeAxis, {
              units,
              scaleInfo,
              key,
              axisType,
              clipUnits,
              verticalSpacing: unconformityHeight,
              ...rest,
            });
          })
        ),
        h(
          "div.main-column",
          sections.map((group, i) => {
            const { units, scaleInfo, section_id } = group;
            const lastGroup = sections[i - 1];

            const key = `section-${section_id}`;
            console.log("Rendering section", key, group, scaleInfo);

            return h(
              Section,
              {
                units,
                scaleInfo,
                key,
                unitComponent,
                showLabels,
                width,
                columnWidth,
                showLabelColumn,
                axisType,
                clipUnits,
                verticalSpacing: unconformityHeight,
                ...rest,
              },
              // This unconformity is with the section _above_
              h.if(unconformityLabels)(Unconformity, {
                upperUnits: lastGroup?.units,
                lowerUnits: units,
                style: {
                  width: showLabels ? columnWidth : width,
                  height: unconformityHeight,
                },
              })
            );
          })
        ),
        children,
      ]),
    ])
  );
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

function extractFromObj<T, K extends keyof T>(
  obj: T,
  ...keys: K[]
): [Pick<T, K>, Omit<T, K>] {
  /** Extract keys from an object and return the rest */
  const extracted = {} as Pick<T, K>;
  const rest = { ...obj };
  for (const key of keys) {
    extracted[key] = obj[key];
    delete rest[key];
  }
  return [extracted, rest];
}
