import {
  ColumnAxisType,
  ColumnLayoutContext,
  ColumnProvider,
  SVG,
} from "@macrostrat/column-components";
import {
  expandInnerSize,
  useDarkMode,
  useInDarkMode,
} from "@macrostrat/ui-components";
import classNames from "classnames";
import { useContext, useMemo } from "react";
import {
  CompositeUnitsColumn,
  getMixedUnitColor,
  TrackedLabeledUnit,
  useLithologies,
} from "@macrostrat/column-views";
import { SectionRenderData, ColumnIdentifier } from "./types";
import { useCorrelationDiagramStore } from "./state";
import hyper from "@macrostrat/hyper";
import styles from "./column.module.scss";

const h = hyper.styled(styles);

export function MacrostratColumnProvider(props) {
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

function Section(props: ISectionProps) {
  // Section with "squishy" timescale
  const {
    data,
    unitComponent,
    width = 150,
    unitComponentProps,
    columnSpacing = 0,
  } = props;

  const expanded = useCorrelationDiagramStore((s) => s.mapExpanded);

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

  return h(
    ColumnSVG,
    {
      innerWidth: columnWidth,
      paddingH: columnSpacing / 2,
      paddingV: 10,
      innerHeight: height,
    },
    h(
      MacrostratColumnProvider,
      {
        divisions: units,
        range,
        pixelsPerMeter: pixelScale, // Actually pixels per myr
      },
      [
        h(CompositeUnitsColumn, {
          width: columnWidth,
          columnWidth,
          gutterWidth: 5,
          showLabels: false,
          unitComponent,
          unitComponentProps: _unitComponentProps,
          clipToFrame: false,
        }),
      ]
    )
  );
}

function ColumnSVG(props) {
  //# Need to rework to use UI Box code
  const { children, className, innerRef, style, ...rest } = props;
  const nextProps = expandInnerSize(rest);
  const {
    paddingLeft,
    paddingTop,
    innerHeight,
    innerWidth,
    height,
    width,
    ...remainingProps
  } = nextProps;
  return h(
    SVG,
    {
      className: classNames(className, "section"),
      height,
      width,
      innerRef,
      ...remainingProps,
      style,
    },
    h(
      "g.backdrop",
      {
        transform: `translate(${paddingLeft},${paddingTop})`,
      },
      children
    )
  );
}

export function UnitComponent({ division, nColumns = 2, ...rest }) {
  const { width } = useContext(ColumnLayoutContext);
  const lithMap = useLithologies();
  const inDarkMode = useInDarkMode();

  const backgroundColor = getMixedUnitColor(division, lithMap, inDarkMode);

  return h(TrackedLabeledUnit, {
    division,
    ...rest,
    backgroundColor,
    width: division.overlappingUnits.length > 0 ? width / nColumns : width,
    x: (division.column * width) / nColumns,
  });
}

function Unconformity({ upperUnits = [], lowerUnits = [], style }) {
  if (upperUnits.length == 0 || lowerUnits.length == 0) {
    return null;
  }

  const ageGap = lowerUnits[0].t_age - upperUnits[upperUnits.length - 1].b_age;

  return h(
    "div.unconformity",
    { style },
    h("div.unconformity-text", `${ageGap.toFixed(1)} Ma`)
  );
}

export function Column({
  data,
  columnSpacing,
  width,
}: {
  column: ColumnIdentifier;
  data: SectionRenderData;
  width: number;
  columnSpacing: number;
}) {
  const darkMode = useDarkMode();

  const className = classNames({
    "dark-mode": darkMode?.isEnabled ?? false,
  });

  return h(
    "div.column-container",
    { className },
    h("div.column", [
      h(`div.section`, [
        h(Section, {
          data,
          unitComponent: UnitComponent,
          showLabels: false,
          width,
          columnSpacing,
        }),
      ]),
    ])
  );
}
