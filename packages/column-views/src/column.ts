import { ColumnAxisType } from "@macrostrat/column-components";
import { hyperStyled } from "@macrostrat/hyper";
import { useDarkMode } from "@macrostrat/ui-components";
import classNames from "classnames";
import { RefObject, useRef, HTMLAttributes, useCallback } from "react";
import styles from "./column.module.sass";
import {
  UnitSelectionProvider,
  UnitComponent,
  UnitKeyboardNavigation,
  useUnitSelectionDispatch,
} from "./units";

import { ColumnHeightScaleOptions } from "./prepare-units/composite-scale";
import { UnitSelectionPopover } from "./unit-details";
import {
  MacrostratColumnDataProvider,
  useCompositeScale,
  useMacrostratColumnData,
} from "./data-provider";
import {
  SectionSharedProps,
  CompositeTimescale,
  SectionsColumn,
} from "./section";
import { CompositeAgeAxis } from "./age-axis";
import { MergeSectionsMode, usePreparedColumnUnits } from "./prepare-units";
import { UnitLong } from "@macrostrat/api-types";
import { NonIdealState } from "@blueprintjs/core";

const h = hyperStyled(styles);

interface BaseColumnProps extends SectionSharedProps {
  className?: string;
  showLabelColumn?: boolean;
  keyboardNavigation?: boolean;
  showLabels?: boolean;
  maxInternalColumns?: number;
  // Timescale properties
  showTimescale?: boolean;
  timescaleLevels?: number | [number, number];
  onMouseOver?: (
    unit: UnitLong | null,
    height: number | null,
    evt: MouseEvent
  ) => void;
}

export interface ColumnProps extends BaseColumnProps, ColumnHeightScaleOptions {
  // Macrostrat units
  units: UnitLong[];
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
    minSectionHeight = 50,
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

  if (sections.length === 0) {
    return h(
      "div.column-container.empty",
      h(NonIdealState, {
        title: "Empty column",
        description: "No sections found in this column.",
        icon: "warning-sign",
      })
    );
  }

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
    className,
    columnRef,
    clipUnits = false,
    children,
    showTimescale,
    timescaleLevels,
    maxInternalColumns,
    onMouseOver,
  } = props;

  const { axisType } = useMacrostratColumnData();

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
    ColumnContainer,
    {
      ...useMouseEventHandlers(onMouseOver),
      className,
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
        maxInternalColumns,
      }),
      children,
    ])
  );
}

type ColumnMouseOverHandler = (
  unit: UnitLong | null,
  height: number | null,
  evt: MouseEvent
) => void;

function useMouseEventHandlers(
  _onMouseOver: ColumnMouseOverHandler | null = null
) {
  /** Click event handler */

  // Click handler for unit selection
  const dispatch = useUnitSelectionDispatch();
  const onClick = useCallback(
    (evt) => {
      dispatch?.(null, null, evt as any);
    },
    [dispatch]
  );

  /** Hover event handlers */
  const scale = useCompositeScale();

  const onMouseOver = useCallback(
    (evt) => {
      const height = scale.invert(
        evt.clientY - evt.currentTarget.getBoundingClientRect().top
      );
      _onMouseOver?.(null, height, evt);
    },
    [scale, _onMouseOver]
  );

  const onMouseOut = useCallback(() => {
    _onMouseOver?.(null, null, null);
  }, [_onMouseOver]);

  if (_onMouseOver == null) {
    return {
      onClick,
      onMouseOver: undefined,
      onMouseMove: undefined,
      onMouseOut: undefined,
    };
  }

  return { onMouseOver, onMouseMove: onMouseOver, onMouseOut, onClick };
}

export interface ColumnContainerProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function ColumnContainer(props: ColumnContainerProps) {
  const { className, ...rest } = props;
  const darkMode = useDarkMode();

  return h("div.column-container", {
    className: classNames(className, {
      "dark-mode": darkMode?.isEnabled ?? false,
    }),
    ...rest,
  });
}
