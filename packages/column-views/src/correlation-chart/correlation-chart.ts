/** Correlation chart */
import {
  UnitSelectionProvider,
  UnitKeyboardNavigation,
  useUnitSelectionStore,
} from "../units";
import { UnitSelectionPopover } from "../unit-details";
import hyper from "@macrostrat/hyper";
import styles from "./correlation-chart.module.sass";
import { useMemo, useRef } from "react";
import { useInDarkMode } from "@macrostrat/ui-components";
import { CompositeTimescaleCore } from "../section";
import classNames from "classnames";
import {
  findLaterallyExtensiveUnits,
  splitStratIntoBoxes,
  UnitGroupBox,
  AgeScaleMode,
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
import { ExtUnit } from "../prepare-units/helpers";
import { ColumnContainer } from "../column";
import { ColumnData } from "../data-provider";

const h = hyper.styled(styles);

export interface CorrelationChartProps extends CorrelationChartSettings {
  data: ColumnData[];
  columnWidth?: number;
  columnSpacing?: number;
  targetUnitHeight?: number;
  ageMode?: AgeScaleMode;
}

export function CorrelationChart({
  data,
  columnSpacing = 0,
  columnWidth = 130,
  ...scaleProps
}: CorrelationChartProps) {
  const defaultScaleProps = {
    targetUnitHeight: 10,
    unconformityHeight: 60,
    ageMode: AgeScaleMode.Broken,
    minSectionHeight: 60,
    collapseSmallUnconformities: true,
  };

  const chartData = useMemo(() => {
    if (!data) return null;
    return buildCorrelationChartData(data, {
      ...defaultScaleProps,
      ...scaleProps,
    });
  }, [data, ...Object.values(scaleProps)]);

  const columnRef = useRef(null);

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
      { columnRef },
      h(ChartArea, [
        h(TimescaleColumn, {
          key: "timescale",
          scaleInfo,
        }),
        h("div.main-chart", { ref: columnRef }, [
          h(
            SVG,
            {
              className,
              innerWidth: mainWidth,
              height: scaleInfo.totalHeight,
              paddingH: 4,
            },
            packages.map((pkg, i) => {
              const { offset, domain, pixelScale, key } = scaleInfo.packages[i];
              return h(Package, {
                columnData: pkg.columnData,
                key,
                columnWidth,
                columnSpacing,
                offset,
                domain,
                pixelScale,
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

function Package({
  columnData,
  columnSpacing,
  columnWidth,
  offset,
  domain,
  pixelScale,
}) {
  return h("g.package", { transform: `translate(0 ${offset})` }, [
    // Disable the SVG overlay for now
    //h(PackageSVGOverlay, { data, columnSpacing }),
    h("g.column-units", [
      columnData.map((data, i) => {
        return h(Column, {
          units: data.units,
          width: columnWidth,
          key: i,
          domain,
          pixelScale,
          offsetLeft: i * (columnWidth + columnSpacing),
        });
      }),
    ]),
  ]);
}

interface ColumnProps {
  units: ExtUnit[];
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
}

function Column(props: ColumnProps) {
  const { units, width = 150, offsetLeft, domain, pixelScale } = props;

  const columnWidth = width;

  if (units.length == 0) {
    return null;
  }

  return h(
    "g.section",
    {
      transform: `translate(${offsetLeft} 0)`,
    },
    h(
      ColumnProvider,
      {
        divisions: units,
        range: domain,
        pixelsPerMeter: pixelScale, // Actually pixels per myr
        axisType: ColumnAxisType.AGE,
      },
      h(UnitBoxes, {
        unitComponent: ColoredUnitComponent,
        unitComponentProps: {
          nColumns: 1,
          width: columnWidth,
        },
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
  scaleInfo: CompositeStratigraphicScaleInfo;
  showLabels?: boolean;
  unconformityLabels?: boolean;
}

function TimescaleColumn(props: TimescaleColumnProps) {
  const { scaleInfo } = props;
  return h("div.column-container.age-axis-container", [
    h(CompositeAgeAxisCore, { ...scaleInfo }),
    h(CompositeTimescaleCore, { ...scaleInfo }),
  ]);
}
