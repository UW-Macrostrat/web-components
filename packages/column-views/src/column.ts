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
  ColumnScaleOptions,
  SectionInfo,
  buildSectionScaleInformation,
} from "./prepare-units/composite-scale";
import {} from "./units";
import { UnitSelectionPopover } from "./selection-popover";
import { MacrostratUnitsProvider } from "./store";
import { SectionSharedProps, Section } from "./section";
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
    ...rest
  } = props;
  const ref = useRef<HTMLElement>();
  // Selected item position

  const [sectionGroups, units] = usePreparedColumnUnits(rawUnits, {
    axisType,
    t_age,
    b_age,
    mergeSections,
  });

  return h(
    UnitSelectionProvider,
    { columnRef: ref, onUnitSelected, selectedUnit, units },
    h(
      ColumnInner,
      {
        columnRef: ref,
        units,
        axisType,
        sectionGroups,
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

export function useCompositeScaledGroups(
  groups: SectionInfo[],
  opts: ColumnScaleOptions
): CompositeScaleInformation {
  return useMemo(() => {
    return buildSectionScaleInformation(groups, opts);
  }, [groups, Object.values(opts)]);
}

interface ColumnInnerProps extends BaseColumnProps {
  sectionGroups: SectionInfo[];
  columnRef: RefObject<HTMLElement>;
  units: ExtUnit[];
}

function ColumnInner(props: ColumnInnerProps) {
  const {
    units,
    sectionGroups,
    unitComponent = UnitComponent,
    unconformityLabels = true,
    unconformityHeight = 30,
    showLabels = true,
    width = 300,
    columnWidth = 150,
    className: baseClassName,
    showLabelColumn = true,
    axisType = ColumnAxisType.AGE,
    columnRef,
    clipUnits = false,
    children,
    targetUnitHeight = 20,
    pixelScale,
    minPixelScale = 0.2,
    minSectionHeight = 30,
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

  const { sections, totalHeight } = useCompositeScaledGroups(sectionGroups, {
    axisType,
    targetUnitHeight,
    unconformityHeight,
    pixelScale,
    minPixelScale,
    minSectionHeight,
  });

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
        h(
          "div.main-column",
          sections.map((group, i) => {
            const { units, scaleInfo } = group;
            const lastGroup = sections[i - 1];

            return h(
              Section,
              {
                units,
                scaleInfo,
                key: i,
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
