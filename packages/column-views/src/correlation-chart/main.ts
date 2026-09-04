/** Correlation chart */
import {
  UnitSelectionProvider,
  UnitKeyboardNavigation,
  useUnitSelectionDispatch,
  useColumnRef,
} from "../data-provider";
import { UnitDetailsFeature, UnitSelectionPopover } from "../unit-details";
import h from "./main.module.sass";
import { useMemo } from "react";
import { useInDarkMode } from "@macrostrat/ui-components";
import { CompositeTimescaleCore } from "../section";
import classNames from "classnames";
import {
  findLaterallyExtensiveUnits,
  splitStratIntoBoxes,
  UnitGroupBox,
  CorrelationChartSettings,
  buildCorrelationChartData,
} from "./prepare-data";
import {
  CompositeAgeAxisCore,
  CompositeStratigraphicScaleInfo,
} from "../age-axis";
import {
  ColumnAxisType,
  ColumnProvider,
  SVG,
} from "@macrostrat/column-components";
import { ColoredUnitComponent } from "../units";
import { UnitBoxes } from "../units/boxes";
import { ColumnContainer } from "../column";
import type { ColumnData } from "@macrostrat/data-provider";
import { BaseUnit } from "@macrostrat/api-types";
import { ScaleContinuousNumeric } from "d3-scale";
import { ExtUnit } from "../prepare-units/types";
import type {
  IntervalStyleBuilder,
  TimescaleClickHandler,
} from "@macrostrat/timescale";
import { useMacrostratColumnInfo } from "@macrostrat/data-provider";

/** Standard props passed to a `columnHeaderComponent`. Everything a header
 * needs is provided here, so the component can be a pure function of its props
 * (no hooks required). Column-level hover/click are handled by the chart. */
export interface ColumnHeaderProps {
  /** The column data (units + identifier) for this column */
  column: ColumnData;
  /** The column's ID (col_id) */
  columnID: number;
  /** The column's index (left-to-right) within the chart */
  columnIndex: number;
  /** The units within the column */
  units: ExtUnit[];
  /** The rendered width of the column, in pixels */
  width: number;
  /** The column's name, resolved from column metadata when available */
  columnName?: string | null;
}

export interface CorrelationChartProps extends CorrelationChartSettings {
  data: ColumnData[];
  columnWidth?: number;
  columnSpacing?: number;
  targetUnitHeight?: number;
  unconformityLabels?: boolean;
  selectedUnit?: number | null;
  showUnitPopover?: boolean;
  unitComponent?: any;
  /** Arbitrary content (e.g. column title and/or ID) rendered above each column */
  columnHeaderComponent?: React.ComponentType<ColumnHeaderProps>;
  /** Content rendered above the timescale axis (top-left), beside the column
   * headers — e.g. a zoom/filter indicator. */
  axisTopContent?: React.ReactNode;
  /** True while the age window is animating (e.g. from `useAnimatedAgeWindow`).
   * Propagated to each column's context so per-frame label/pattern work can be
   * skipped during the transition. */
  isTransitioning?: boolean;
  /** Hide unit labels while transitioning (perf escape hatch; default false —
   * labels stay visible through the animation). */
  hideLabelsWhileTransitioning?: boolean;
  onUnitSelected?: (unitID: number | null, unit: BaseUnit | null) => void;
  /** Called when a timescale interval is clicked (e.g. to zoom the age range) */
  onClickTimescaleInterval?: TimescaleClickHandler;
  /** Called when the pointer enters/leaves a column (header or body). Passes
   * the column ID, or null on leave. */
  onColumnMouseOver?: (columnID: number | null) => void;
  /** Called when a column header is clicked (e.g. to frame it on a map) */
  onColumnClick?: (columnID: number) => void;
}

/** Horizontal padding of the main chart SVG. Column headers are aligned to
 * this so that they line up with the columns beneath them. */
const chartPaddingH = 4;

/** Default scale settings for the correlation chart. */
const defaultCorrelationChartScaleProps = {
  targetUnitHeight: 10,
  unconformityHeight: 60,
  minSectionHeight: 60,
  collapseSmallUnconformities: true,
};

function MainChartArea({ children }) {
  const columnRef = useColumnRef();
  return h("div.main-chart", { ref: columnRef }, children);
}

const unitPopoverFeatures = new Set([
  UnitDetailsFeature.AdjacentUnits,
  UnitDetailsFeature.OutcropType,
  UnitDetailsFeature.DepthRange,
  UnitDetailsFeature.ColumnName,
]);

export function CorrelationChart({
  data,
  columnSpacing = 0,
  columnWidth = 130,
  unconformityLabels = true,
  showUnitPopover = true,
  selectedUnit,
  onUnitSelected,
  unitComponent,
  columnHeaderComponent,
  axisTopContent,
  onClickTimescaleInterval,
  timescaleIntervalStyle,
  onColumnMouseOver,
  onColumnClick,
  isTransitioning = false,
  hideLabelsWhileTransitioning = false,
  ...scaleProps
}: CorrelationChartProps) {
  const chartData = useMemo(() => {
    if (!data) return null;
    return buildCorrelationChartData(data, {
      ...defaultCorrelationChartScaleProps,
      ...scaleProps,
    });
  }, [data, ...Object.values(scaleProps)]);

  // A flattened units array is used to support keyboard navigation
  const units = useMemo(() => {
    return data?.map((d0) => d0.units).flat() ?? [];
  }, [data]);

  const inDarkMode = useInDarkMode();

  const className = classNames({
    "dark-mode": inDarkMode,
  });

  if (chartData == null) {
    return null;
  }

  const { packages, scaleInfo, nColumns } = chartData;

  const mainWidth = (columnWidth + columnSpacing) * nColumns;

  return h(
    ColumnContainer,
    { className: "correlation-diagram" },
    h(
      UnitSelectionProvider,
      { selectedUnit, onUnitSelected, units },
      h(ChartArea, [
        h(TimescaleColumn, {
          scaleInfo,
          unconformityLabels,
          onClickInterval: onClickTimescaleInterval,
          intervalStyle: timescaleIntervalStyle,
        }),
        h(MainChartArea, [
          h(
            SVG,
            {
              className,
              innerWidth: mainWidth,
              height: scaleInfo.totalHeight,
              paddingH: chartPaddingH,
            },
            packages.map((pkg, i) => {
              const { offset, domain, pixelScale, scale, key } =
                scaleInfo.packages[i];
              return h(Package, {
                columnData: pkg.columnData,
                key,
                columnWidth,
                columnSpacing,
                offset,
                domain,
                pixelScale,
                scale,
                unitComponent,
                onColumnMouseOver,
                isTransitioning,
                hideLabelsWhileTransitioning,
              });
            }),
          ),
          h.if(showUnitPopover)(UnitSelectionPopover, {
            features: unitPopoverFeatures,
          }),
          // Navigation only works within a column for now...
          h(UnitKeyboardNavigation, { columnData: data }),
        ]),
        // Rendered last so the sticky header paints above the unit boxes
        // (positioned siblings paint in document order at the same z-index)
        h(ColumnHeaderRow, {
          data,
          columnWidth,
          columnSpacing,
          columnHeaderComponent,
          axisTopContent,
          onColumnMouseOver,
          onColumnClick,
        }),
      ]),
    ),
  );
}

function Package({
  columnData,
  columnSpacing,
  columnWidth,
  unitComponent,
  offset,
  domain,
  pixelScale,
  scale,
  onColumnMouseOver,
  isTransitioning,
  hideLabelsWhileTransitioning,
}) {
  return h("g.package", { transform: `translate(0 ${offset})` }, [
    // Disable the SVG overlay for now
    //h(PackageSVGOverlay, { columnData, columnSpacing }),
    h("g.column-units", [
      columnData.map((data, i) => {
        return h(Column, {
          units: data.units,
          columnID: data.columnID,
          unitComponent,
          width: columnWidth,
          key: i,
          domain,
          pixelScale,
          scale,
          offsetLeft: i * (columnWidth + columnSpacing),
          onColumnMouseOver,
          isTransitioning,
          hideLabelsWhileTransitioning,
        });
      }),
    ]),
  ]);
}

interface ColumnProps {
  units: ExtUnit[];
  columnID?: number;
  unitComponent?: React.FunctionComponent<any>;
  unitComponentProps?: any;
  showLabels?: boolean;
  width?: number;
  columnWidth?: number;
  columnSpacing?: number;
  targetUnitHeight?: number;
  offsetLeft?: number;
  domain: [number, number];
  pixelScale: number;
  scale?: ScaleContinuousNumeric<number, number>;
  onColumnMouseOver?: (columnID: number | null) => void;
  isTransitioning?: boolean;
  hideLabelsWhileTransitioning?: boolean;
}

function Column(props: ColumnProps) {
  const {
    units,
    columnID,
    width = 150,
    offsetLeft,
    domain,
    pixelScale,
    scale,
    unitComponent = ColoredUnitComponent,
    onColumnMouseOver,
    isTransitioning,
    hideLabelsWhileTransitioning,
  } = props;

  const columnWidth = width;

  if (units.length == 0) {
    return null;
  }

  const hoverHandlers =
    onColumnMouseOver != null && columnID != null
      ? {
          onMouseEnter: () => onColumnMouseOver(columnID),
          onMouseLeave: () => onColumnMouseOver(null),
        }
      : {};

  return h(
    "g.section",
    {
      transform: `translate(${offsetLeft} 0)`,
      ...hoverHandlers,
    },
    h(
      ColumnProvider,
      {
        // Need to tighten up types here...
        divisions: units as any[],
        range: domain,
        scale,
        pixelsPerMeter: pixelScale, // Actually pixels per myr
        axisType: ColumnAxisType.AGE,
        isTransitioning,
        hideLabelsWhileTransitioning,
      },
      h(UnitBoxes, {
        unitComponent,
        unitComponentProps: {
          width: columnWidth,
          showLabel: true,
        },
      }),
    ),
  );
}

function PackageSVGOverlay({ data, columnWidth = 100, columnSpacing = 0 }) {
  const { b_age, t_age, bestPixelScale, columnData } = data;

  const width = (columnWidth + columnSpacing) * columnData.length;
  const height = Math.ceil((b_age - t_age) * bestPixelScale) + 2;

  const extensiveUnits = findLaterallyExtensiveUnits(data);

  const scale = (val: number) => {
    return (val - t_age) * bestPixelScale;
  };

  return h(
    "div.package-overlay",
    { style: { width, height } },
    extensiveUnits.map((d) => {
      return h(LaterallyExtensiveUnit, {
        data: d,
        scale,
        pixelScale: bestPixelScale,
        columnSpacing,
      });
    }),
  );
}

function LaterallyExtensiveUnit({ data, scale, pixelScale, columnSpacing }) {
  const { b_age, t_age, strat_name_long, units } = data;
  // Build boxes by column groups
  const boxes: UnitGroupBox[] = splitStratIntoBoxes(data);

  return h(
    "div.laterally-extensive-unit",
    boxes.map((d, i) => {
      return h(StratColSpan, {
        scale,
        data: d,
        pixelScale,
        key: i,
        columnSpacing,
      });
    }),
  );
}

function StratColSpan({
  data,
  scale,
  columnWidth = 100,
  columnSpacing = 0,
  pixelScale = 1,
}) {
  const { startCol, endCol, strat_name_long, t_age, b_age } = data;
  const top = scale(t_age);
  const left = startCol * (columnWidth + columnSpacing);
  const width = (endCol - startCol + 1) * (columnWidth + columnSpacing);
  const height = (b_age - t_age) * pixelScale;
  return h(
    "div.strat-col-span",
    { style: { top, height, width, left } },
    strat_name_long,
  );
}

function ChartArea({ children }) {
  const setSelectedUnit = useUnitSelectionDispatch();

  return h(
    "div.correlation-chart-inner",
    {
      onClick() {
        setSelectedUnit(null, null);
      },
    },
    children,
  );
}

interface ColumnHeaderRowProps {
  data: ColumnData[];
  columnWidth: number;
  columnSpacing: number;
  columnHeaderComponent?: React.ComponentType<ColumnHeaderProps>;
  axisTopContent?: React.ReactNode;
  onColumnMouseOver?: (columnID: number | null) => void;
  onColumnClick?: (columnID: number) => void;
}

function ColumnHeaderRow({
  data,
  columnWidth,
  columnSpacing,
  columnHeaderComponent,
  axisTopContent,
  onColumnMouseOver,
  onColumnClick,
}: ColumnHeaderRowProps) {
  /** The top grid row: arbitrary content above the timescale axis (top-left)
   * and, when a header component is provided, per-column headers aligned with
   * the columns. Collapses to nothing when neither is present. */
  const Component = columnHeaderComponent;
  if (Component == null && axisTopContent == null) {
    return null;
  }

  return h([
    h("div.column-header-spacer", axisTopContent),
    h.if(Component != null)(
      "div.column-header-row",
      {
        style: {
          paddingLeft: chartPaddingH,
          paddingRight: chartPaddingH,
          gap: columnSpacing,
        },
      },
      data.map((column, i) => {
        return h(ColumnHeaderCell, {
          key: column.columnID ?? i,
          column,
          columnIndex: i,
          columnWidth,
          Component: Component!,
          onColumnMouseOver,
          onColumnClick,
        });
      }),
    ),
  ]);
}

function ColumnHeaderCell({
  column,
  columnIndex,
  columnWidth,
  Component,
  onColumnMouseOver,
  onColumnClick,
}: {
  column: ColumnData;
  columnIndex: number;
  columnWidth: number;
  Component: React.ComponentType<ColumnHeaderProps>;
  onColumnMouseOver?: (columnID: number | null) => void;
  onColumnClick?: (columnID: number) => void;
}) {
  /** Resolves the column name and wires column-level hover/click so the header
   * component itself can stay a pure function of props. */
  const columnID = column.columnID;
  const info = useMacrostratColumnInfo(columnID);

  return h(
    "div.column-header-cell",
    {
      style: {
        width: columnWidth,
        minWidth: columnWidth,
        maxWidth: columnWidth,
      },
      onMouseEnter: () => onColumnMouseOver?.(columnID),
      onMouseLeave: () => onColumnMouseOver?.(null),
      onClick: onColumnClick
        ? (e: React.MouseEvent) => {
            e.stopPropagation();
            onColumnClick(columnID);
          }
        : undefined,
    },
    h(Component, {
      column,
      columnID,
      columnIndex,
      units: column.units as ExtUnit[],
      width: columnWidth,
      columnName: info?.col_name ?? null,
    }),
  );
}

interface TimescaleColumnProps {
  scaleInfo: CompositeStratigraphicScaleInfo;
  showLabels?: boolean;
  unconformityLabels?: boolean;
  onClickInterval?: TimescaleClickHandler;
  intervalStyle?: IntervalStyleBuilder;
}

function TimescaleColumn(props: TimescaleColumnProps) {
  const {
    scaleInfo,
    unconformityLabels = true,
    onClickInterval,
    intervalStyle,
  } = props;
  return h("div.column-container.age-axis-container", [
    h(CompositeAgeAxisCore, { ...scaleInfo }),
    h(CompositeTimescaleCore, {
      ...scaleInfo,
      unconformityLabels,
      onClickInterval,
      intervalStyle,
    }),
  ]);
}
