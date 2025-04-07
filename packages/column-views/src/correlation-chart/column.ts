import {
  ColumnAxisType,
  ColumnProvider,
  SVG,
} from "@macrostrat/column-components";
import { expandInnerSize, useDarkMode } from "@macrostrat/ui-components";
import classNames from "classnames";
import { useMemo } from "react";
import { CompositeUnitsColumn } from "@macrostrat/column-views";
import { SectionRenderData, ColumnIdentifier } from "./types";
import { ColoredUnitComponent } from "../units";
import hyper from "@macrostrat/hyper";
import styles from "./correlation-chart.module.sass";

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

export function Column(props: ISectionProps) {
  // Section with "squishy" timescale
  const {
    data,
    unitComponent,
    width = 150,
    unitComponentProps,
    columnSpacing = 0,
  } = props;

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

  const darkMode = useDarkMode();

  const className = classNames({
    "dark-mode": darkMode?.isEnabled ?? false,
  });

  return h(
    "div.column-container",
    { className },
    h("div.column", [
      h(SVG, { className: "section", ...nextProps }, [
        h(
          "g.backdrop",
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
        ),
      ]),
    ])
  );
}
