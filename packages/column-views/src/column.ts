import { ColumnAxisType } from "@macrostrat/column-components";
import { hyperStyled } from "@macrostrat/hyper";
import {
  Box,
  extractPadding,
  Padding,
  useDarkMode,
} from "@macrostrat/ui-components";
import classNames from "classnames";
import {
  RefObject,
  useRef,
  HTMLAttributes,
  useCallback,
  CSSProperties,
  ComponentType,
} from "react";
import styles from "./column.module.sass";
import {
  UnitSelectionProvider,
  UnitComponent,
  UnitKeyboardNavigation,
  useUnitSelectionDispatch,
} from "./units";

import {
  Identifier,
  ReferencesField,
  UnitSelectionPopover,
} from "./unit-details";
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
import { ApproximateHeightAxis, CompositeAgeAxis } from "./age-axis";
import {
  MergeSectionsMode,
  usePreparedColumnUnits,
  HybridScaleType,
  ColumnHeightScaleOptions,
} from "./prepare-units";
import { UnitLong } from "@macrostrat/api-types";
import { NonIdealState } from "@blueprintjs/core";
import { DataField } from "@macrostrat/data-components";
import { ScaleContinuousNumeric } from "d3-scale";

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
    evt: MouseEvent,
  ) => void;
}

export interface ColumnProps
  extends Padding,
    BaseColumnProps,
    ColumnHeightScaleOptions {
  // Macrostrat units
  units: UnitLong[];
  t_age?: number;
  b_age?: number;
  t_pos?: number;
  b_pos?: number;
  mergeSections?: MergeSectionsMode;
  showUnitPopover?: boolean;
  allowUnitSelection?: boolean;
  selectedUnit?: number | null;
  onUnitSelected?: (unitID: number | null, unit: any) => void;
  // Unconformity height in pixels
  unconformityHeight?: number;
  scale?: ScaleContinuousNumeric<number, number>;
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
    t_pos,
    b_pos,
    unconformityHeight = 30,
    targetUnitHeight = 20,
    pixelScale,
    minPixelScale = 0.2,
    minSectionHeight = 50,
    collapseSmallUnconformities = true,
    allowUnitSelection,
    hybridScale,
    scale,
    ...rest
  } = props;
  const ref = useRef<HTMLElement>();
  // Selected item position

  /* Make pixelScale and targetUnitHeight mutually exclusive. PixelScale implies
   * standardization of scales in all sections */
  let _targetUnitHeight = targetUnitHeight;
  let _minSectionHeight = minSectionHeight;
  let _minPixelScale = minPixelScale;
  if (pixelScale != null) {
    _targetUnitHeight = null;
    _minSectionHeight = 0;
    _minPixelScale = pixelScale;
  }

  const { sections, units, totalHeight } = usePreparedColumnUnits(rawUnits, {
    axisType,
    t_age,
    b_age,
    t_pos,
    b_pos,
    mergeSections,
    targetUnitHeight: _targetUnitHeight,
    unconformityHeight,
    pixelScale,
    minPixelScale: _minPixelScale,
    minSectionHeight: _minSectionHeight,
    collapseSmallUnconformities,
    // TODO: consider unifying scale and hybridScale options
    scale,
    hybridScale,
  });

  if (sections.length === 0) {
    return h(
      "div.column-container.empty",
      h(NonIdealState, {
        title: "Empty column",
        description: "No sections found in this column.",
        icon: "warning-sign",
      }),
    );
  }

  let ageAxisComponent = CompositeAgeAxis;
  if (
    hybridScale?.type === HybridScaleType.ApproximateHeight &&
    axisType != ColumnAxisType.AGE
  ) {
    // Use approximate height axis for non-age columns if a non-age axis type is requested
    ageAxisComponent = ApproximateHeightAxis;
  }

  let main: any = h(
    ColumnInner,
    { columnRef: ref, ageAxisComponent, ...rest },
    [
      children,
      h.if(showUnitPopover)(UnitSelectionPopover),
      h.if(keyboardNavigation)(UnitKeyboardNavigation, { units }),
    ],
  );

  /* By default, unit selection is disabled. However, if any related props are passed,
   we enable it.
   */
  let _allowUnitSelection = allowUnitSelection ?? false;
  if (showUnitPopover || selectedUnit != null || onUnitSelected != null) {
    _allowUnitSelection = true;
  }

  if (_allowUnitSelection) {
    main = h(
      UnitSelectionProvider,
      {
        columnRef: ref,
        onUnitSelected,
        selectedUnit,
        units,
      },
      main,
    );
  }

  return h(
    MacrostratColumnDataProvider,
    { units, sections, totalHeight, axisType },
    main,
  );
}

interface ColumnInnerProps extends BaseColumnProps {
  columnRef: RefObject<HTMLElement>;
  ageAxisComponent?: ComponentType;
}

function ColumnInner(props: ColumnInnerProps) {
  const padding = extractPadding(props);

  // TODO: integrate padding vars more closely with the rest of the spacing (right now padding is a bit ad-hoc)
  const paddingVars: any = {
    "--column-padding-top": `${padding.paddingTop}px`,
    "--column-padding-bottom": `${padding.paddingBottom}px`,
    "--column-padding-left": `${padding.paddingLeft}px`,
    "--column-padding-right": `${padding.paddingRight}px`,
  };

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
    ageAxisComponent = CompositeAgeAxis,
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

  let _showTimescale = showTimescale ?? true;
  if (timescaleLevels != null) {
    _showTimescale = true;
  }
  _showTimescale = axisType == ColumnAxisType.AGE && _showTimescale;

  return h(
    ColumnContainer,
    {
      ...useMouseEventHandlers(onMouseOver),
      style: paddingVars,
      className,
    },
    h("div.column", { ref: columnRef }, [
      h(ageAxisComponent),
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
    ]),
  );
}

type ColumnMouseOverHandler = (
  unit: UnitLong | null,
  height: number | null,
  evt: MouseEvent,
) => void;

function useMouseEventHandlers(
  _onMouseOver: ColumnMouseOverHandler | null = null,
) {
  /** Click event handler */

  // Click handler for unit selection
  const dispatch = useUnitSelectionDispatch();
  const onClick = useCallback(
    (evt) => {
      dispatch?.(null, null, evt as any);
    },
    [dispatch],
  );

  /** Hover event handlers */
  const scale = useCompositeScale();

  const onMouseOver = useCallback(
    (evt) => {
      const height = scale.invert(
        evt.clientY - evt.currentTarget.getBoundingClientRect().top,
      );
      _onMouseOver?.(null, height, evt);
    },
    [scale, _onMouseOver],
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
  style?: CSSProperties;
}

export function ColumnContainer(props: ColumnContainerProps) {
  const { className, ...rest } = props;
  const darkMode = useDarkMode();

  return h(Box, {
    className: classNames(
      className,
      {
        "dark-mode": darkMode?.isEnabled ?? false,
      },
      "column-container",
    ),
    ...rest,
  });
}

export function ColumnBasicInfo({ data, showColumnID = true }) {
  if (data == null) return null;
  return h("div.column-info", [
    h("div.column-title-row", [
      h("h2", data.col_name),
      h.if(showColumnID)("h4", h(Identifier, { id: data.col_id })),
    ]),
    h(DataField, { row: true, label: "Group", value: data.col_group }),
    h(ReferencesField, {
      refs: data.refs,
      inline: false,
      row: true,
      className: "column-refs",
    }),
  ]);
}
