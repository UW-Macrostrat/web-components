import { ColumnAxisType } from "@macrostrat/column-components";
import { hyperStyled } from "@macrostrat/hyper";
import { useDarkMode } from "@macrostrat/ui-components";
import classNames from "classnames";
import { RefObject, useRef } from "react";
import styles from "./column.module.sass";
import {
  UnitSelectionProvider,
  UnitComponent,
  UnitKeyboardNavigation,
  useUnitSelectionDispatch,
} from "./units";

import { ColumnHeightScaleOptions } from "./prepare-units/composite-scale";
import { UnitSelectionPopover } from "./selection-popover";
import {
  MacrostratColumnDataProvider,
  useMacrostratColumnData,
} from "./data-provider";
import {
  SectionSharedProps,
  CompositeTimescale,
  SectionsColumn,
} from "./section";
import { CompositeAgeAxis } from "./age-axis";
import { MergeSectionsMode, usePreparedColumnUnits } from "./prepare-units";
import { BaseUnit } from "@macrostrat/api-types";

const h = hyperStyled(styles);

interface BaseColumnProps extends SectionSharedProps {
  className?: string;
  showLabelColumn?: boolean;
  keyboardNavigation?: boolean;
  showLabels?: boolean;
  maxInternalColumns?: number;
  // Timescale properties
  showTimescale?: boolean;
  timescaleLevels?: [number, number];
}

export interface ColumnProps extends BaseColumnProps, ColumnHeightScaleOptions {
  // Macrostrat units
  units: BaseUnit[];
  t_age?: number;
  b_age?: number;
  mergeSections?: MergeSectionsMode;
  showUnitPopover?: boolean;
  selectedUnit?: number | null;
  onUnitSelected?: (unitID: number | null, unit: any) => void;
  // Unconformity height in pixels
  unconformityHeight?: number;
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
    axisType = ColumnAxisType.AGE,
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
    MacrostratColumnDataProvider,
    { units, sections, totalHeight, axisType },
    h(
      UnitSelectionProvider,
      { columnRef: ref, onUnitSelected, selectedUnit, units },
      h(ColumnInner, { columnRef: ref, ...rest }, [
        children,
        h.if(showUnitPopover)(UnitSelectionPopover),
        h.if(keyboardNavigation)(UnitKeyboardNavigation, { units }),
      ])
    )
  );
}

interface ColumnInnerProps extends BaseColumnProps {
  columnRef: RefObject<HTMLElement>;
}

function ColumnInner(props: ColumnInnerProps) {
  const {
    unitComponent = UnitComponent,
    unconformityLabels = true,
    showLabels = true,
    width: _width = 300,
    columnWidth: _columnWidth = 150,
    showLabelColumn: _showLabelColumn = true,
    className: baseClassName,
    columnRef,
    clipUnits = false,
    children,
    showTimescale,
    timescaleLevels,
  } = props;

  const darkMode = useDarkMode();
  const { axisType } = useMacrostratColumnData();

  const className = classNames(baseClassName, {
    "dark-mode": darkMode?.isEnabled ?? false,
  });

  const dispatch = useUnitSelectionDispatch();

  let width = _width;
  let columnWidth = _columnWidth;
  if (columnWidth > width) {
    columnWidth = width;
  }
  let showLabelColumn = _showLabelColumn;
  if (columnWidth > width - 10) {
    showLabelColumn = false;
  }

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
    h("div.column", { ref: columnRef }, [
      h(CompositeAgeAxis),
      h.if(_showTimescale)(CompositeTimescale, { levels: timescaleLevels }),
      h(SectionsColumn, {
        unitComponent,
        showLabels,
        width,
        columnWidth,
        showLabelColumn,
        clipUnits,
        unconformityLabels,
      }),
      children,
    ])
  );
}
