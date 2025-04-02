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
import {
  SectionSharedProps,
  CompositeTimescale,
  SectionsColumn,
} from "./section";
import { CompositeAgeAxis } from "./age-axis";
import { MergeSectionsMode, usePreparedColumnUnits } from "./prepare-units";
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
  // Timescale properties
  showTimescale?: boolean;
  timescaleLevels?: [number, number];
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
    showTimescale,
    timescaleLevels,
    ...rest
  } = props;

  const darkMode = useDarkMode();

  const className = classNames(baseClassName, {
    "dark-mode": darkMode?.isEnabled ?? false,
  });

  const dispatch = useUnitSelectionDispatch();

  let _showTimescale = showTimescale;
  if (timescaleLevels !== null) {
    _showTimescale = true;
  }
  _showTimescale = axisType == ColumnAxisType.AGE && _showTimescale;

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
        h(CompositeAgeAxis, {
          sections,
          totalHeight,
          axisType,
        }),
        h.if(_showTimescale)(CompositeTimescale, {
          sections,
        }),
        h(SectionsColumn, {
          sections,
          unitComponent,
          showLabels,
          width,
          columnWidth,
          showLabelColumn,
          axisType,
          clipUnits,
          unconformityHeight,
          unconformityLabels,
          totalHeight,
        }),
        children,
      ]),
    ])
  );
}
