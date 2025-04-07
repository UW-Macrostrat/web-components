/** Correlation chart */
import {
  UnitSelectionProvider,
  UnitKeyboardNavigation,
  useUnitSelectionStore,
} from "../units";
import { UnitSelectionPopover } from "../unit-details";
import { SectionRenderData } from "./types";
import { DisplayDensity, useCorrelationDiagramStore } from "./state";
import hyper from "@macrostrat/hyper";
import styles from "./correlation-chart.module.sass";
import { useMemo, useRef } from "react";
import { useDarkMode } from "@macrostrat/ui-components";
import { CompositeTimescaleCore } from "../section";
import classNames from "classnames";
import {
  deriveScale,
  findLaterallyExtensiveUnits,
  splitStratIntoBoxes,
  UnitGroupBox,
  buildColumnData,
  AgeScaleMode,
  regridChartData,
} from "./prepare-data";
import { CompositeAgeAxisCore } from "../age-axis";
import { CorrelationChartData } from "./types";
import {
  ColumnAxisType,
  ColumnProvider,
  SVG,
} from "@macrostrat/column-components";
import { expandInnerSize } from "@macrostrat/ui-components";
import { CompositeUnitsColumn } from "@macrostrat/column-views";
import { ColoredUnitComponent } from "../units";

const h = hyper.styled(styles);

export function CorrelationChart({ data }: { data: CorrelationChartData }) {
  const chartData = data;

  const columnRef = useRef(null);

  // A flattened units array is used to support keyboard navigation
  const units = useMemo(() => {
    return chartData.columnData
      .map((d0) => d0.map((d) => d.units).flat())
      .flat();
  }, [chartData]);

  const columnWidth = 130;
  const columnSpacing = 0;

  const darkMode = useDarkMode();

  const className = classNames({
    "dark-mode": darkMode?.isEnabled ?? false,
  });

  if (chartData == null || chartData.columnData.length == 0) {
    return null;
  }

  const packages = regridChartData(data);

  const firstColumn = chartData.columnData[0];

  const mainWidth = (columnWidth + columnSpacing) * chartData.columnData.length;

  const scaleInfo = deriveScale(firstColumn);

  return h(
    "div.correlation-diagram.column-container",
    { className },
    h(
      UnitSelectionProvider,
      { columnRef },
      h(ChartArea, [
        h(TimescaleColumn, {
          key: "timescale",
          packages: firstColumn,
        }),
        h("div.main-chart", { ref: columnRef }, [
          h(
            SVG,
            {
              className,
              width: mainWidth,
              height: scaleInfo.totalHeight,
            },
            packages.map((pkg, i) => {
              const { offset, scale, pixelHeight, key } = scaleInfo.packages[i];
              return h(Package, {
                data: pkg,
                key,
                columnWidth,
                columnSpacing,
                offset,
                scale,
                pixelHeight,
              });
            })
          ),
          h(UnitSelectionPopover),
          // Navigation only works within a column for now...
          h(UnitKeyboardNavigation, { units }),
        ]),
      ])
    )
  );
}

export function useCorrelationChartData() {
  const columnUnits = useCorrelationDiagramStore((state) => state.columnUnits);
  const displayDensity = useCorrelationDiagramStore((d) => d.displayDensity);

  let targetUnitHeight = 15;
  if (displayDensity === DisplayDensity.LOW) {
    targetUnitHeight = 30;
  }
  if (displayDensity === DisplayDensity.HIGH) {
    targetUnitHeight = 5;
  }

  return buildColumnData(columnUnits, {
    ageMode: AgeScaleMode.Broken,
    targetUnitHeight,
  });
}

function Package({
  data,
  columnSpacing,
  columnWidth,
  offset,
  scale,
  pixelHeight,
}) {
  const { columnData, b_age, t_age, bestPixelScale } = data;

  return h("g.package", { transform: `translate(0 ${offset})` }, [
    // Disable the SVG overlay for now
    //h(PackageSVGOverlay, { data, columnSpacing }),
    h("g.column-container", [
      columnData.map((d, i) => {
        return h(Column, {
          data: {
            ...d,
            b_age,
            t_age,
            bestPixelScale,
          },
          width: columnWidth,
          columnSpacing,
          key: i,
        });
      }),
    ]),
  ]);
}

function MacrostratColumnProvider(props) {
  // A column provider specialized the Macrostrat API
  return h(ColumnProvider, { axisType: ColumnAxisType.AGE, ...props });
}

interface ISectionProps {
  data: SectionRenderData;
  unitComponent?: React.FunctionComponent<any>;
  unitComponentProps?: any;
  showLabels?: boolean;
  width?: number;
  columnWidth?: number;
  columnSpacing?: number;
  targetUnitHeight?: number;
}

function Column(props: ISectionProps) {
  const { data, width = 150, unitComponentProps, columnSpacing = 0 } = props;

  const columnWidth = width;
  const { units, bestPixelScale: pixelScale, t_age, b_age } = data;
  const range = [b_age, t_age];

  const dAge = range[0] - range[1];

  const height = dAge * pixelScale;

  /** Ensure that we can arrange units into the maximum number
   * of columns defined by unitComponentProps, but that we don't
   * use more than necessary.
   */
  const _unitComponentProps = useMemo(() => {
    return {
      ...unitComponentProps,
      nColumns: Math.min(
        Math.max(...units.map((d) => d.column)) + 1,
        unitComponentProps?.nColumns ?? 2
      ),
    };
  }, [units, unitComponentProps]);

  const nextProps = expandInnerSize({
    innerWidth: columnWidth,
    paddingH: columnSpacing / 2,
    paddingV: 10,
    innerHeight: height,
  });

  const { paddingLeft, paddingTop } = nextProps;

  return h(
    "g.section",
    {
      transform: `translate(${paddingLeft},${paddingTop})`,
    },
    h(
      MacrostratColumnProvider,
      {
        divisions: units,
        range,
        pixelsPerMeter: pixelScale, // Actually pixels per myr
      },
      h(CompositeUnitsColumn, {
        width: columnWidth,
        showLabels: false,
        unitComponent: ColoredUnitComponent,
        unitComponentProps: _unitComponentProps,
        clipToFrame: false,
      })
    )
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
    })
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
    })
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
  console.log(b_age, t_age, height);
  return h(
    "div.strat-col-span",
    { style: { top, height, width, left } },
    strat_name_long
  );
}

function ChartArea({ children }) {
  const setSelectedUnit = useUnitSelectionStore(
    (state) => state.setSelectedUnit
  );

  return h(
    "div.correlation-chart-inner",
    {
      onClick() {
        setSelectedUnit(null);
      },
    },
    children
  );
}

interface TimescaleColumnProps {
  packages: SectionRenderData[];
  showLabels?: boolean;
  unconformityLabels?: boolean;
}

export function TimescaleColumn(props: TimescaleColumnProps) {
  const { packages } = props;
  const scaleInfo = deriveScale(packages);
  return h("div.column-container.age-axis-container", [
    h(CompositeAgeAxisCore, { ...scaleInfo }),
    h(CompositeTimescaleCore, { ...scaleInfo }),
  ]);
}
