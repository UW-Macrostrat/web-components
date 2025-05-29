import { format } from "d3-format";
import { useContext } from "react";
import hyper from "@macrostrat/hyper";
import classNames from "classnames";
import { AxisBottom } from "@visx/axis";
import { useMeasurementData } from "./data-provider";

import {
  IsotopesDataArea,
  useDataLocator,
  IsotopeDataPoint,
} from "./data-area";
import { referenceMeasuresToColumn } from "@macrostrat/stratigraphy-utils";
import {
  CrossAxisLayoutProvider,
  ColumnLayoutContext,
  SVG,
} from "@macrostrat/column-components";
import { AxisProps } from "@visx/axis/lib/axis/Axis";
import {
  useMacrostratColumnData,
  useMacrostratUnits,
} from "@macrostrat/column-views";
import styles from "./isotopes-column.module.sass";

const h = hyper.styled(styles);

const fmt = format(".1f");

type IsotopesTextProps = {
  datum: any;
  text: string;
};

function IsotopeText({ datum, text, ...rest }: IsotopesTextProps) {
  const { pointLocator } = useDataLocator();
  const [x, y] = pointLocator(datum);
  return h(
    "text",
    {
      x,
      y,
      ...rest,
    },
    text
  );
}

function ColumnScale(props) {
  const {
    label,
    showAxis = true,
    nTicks = 6,
    tickValues: _tickVals,
    ...rest
  } = props;

  const { totalHeight, sections } = useMacrostratColumnData();
  const { xScale, width } = useContext(ColumnLayoutContext);

  const { scaleInfo } = sections[sections.length - 1];
  const bottomHeight = scaleInfo.offset + scaleInfo.pixelHeight;

  const tickValues = _tickVals ?? xScale.ticks(nTicks);

  return h("g.scale.isotope-scale-axis", [
    h(
      "g.scale-lines",
      tickValues.map((value) => {
        const strokeDasharray = value == 0 ? null : "2 6";
        return h(ScaleLine, { value, stroke: "#ddd", strokeDasharray });
      })
    ),
    h.if(showAxis)([
      h("rect.underlay", {
        x: 0,
        y: totalHeight,
        width,
        height: 30,
      }),
      h(AxisBottom, {
        scale: xScale,
        tickLength: 5,
        tickValues,
        stroke: "var(--column-stroke-color)",
        tickStroke: "var(--column-stroke-color)",
        ...rest,
        top: bottomHeight,
        label,
      }),
    ]),
  ]);
}

interface ScaleLineProps {
  value: number;
  className?: string;
  labelBottom?: boolean;
  labelOffset?: number;
  strokeDasharray?: string;
  stroke?: string | number;
}

function ScaleLine(props: ScaleLineProps) {
  let { value, className, labelBottom, labelOffset, ...rest } = props;
  const { sections } = useMacrostratColumnData();

  const { xScale } = useContext(ColumnLayoutContext);
  const x = xScale(value);
  const transform = `translate(${x})`;
  className = classNames(className, { zero: value === 0 });
  return h("g.tick", { transform, className, key: value }, [
    h(
      "g.tick-lines",
      sections.map((d) => {
        const { scaleInfo } = d;
        const y1 = scaleInfo.offset;
        const y2 = y1 + scaleInfo.pixelHeight;
        return h("line", {
          y1,
          y2,
          strokeDasharray: props.strokeDasharray,
          strokeWidth: 1,
        });
      })
    ),
  ]);
}

function unnestPoints(measures) {
  let points = [];
  for (const meas of measures) {
    const vals = meas.measure_value.map((d, i) => {
      return {
        value: d,
        age: meas.measure_age[i],
        position: meas.measure_position[i],
        unit_id: meas.unit_id,
        sample_id: meas.sample_no[i],
        measurement: meas.measurement,
      };
    });
    Array.prototype.push.apply(points, vals);
  }
  return points;
}

interface IsotopesDatasetProps {
  color: string;
  parameter: string;
}

interface IsotopeColumnProps extends IsotopesDatasetProps {
  width: number;
  tickValues?: number[];
  label: string;
  domain: [number, number];
  transform?: string;
  getHeight?: Function;
}

function IsotopesDataset(props) {
  const { parameter, color = "dodgerblue" } = props;
  const units = useMacrostratUnits();
  const measures = useMeasurementData() ?? [];

  const refMeasures = referenceMeasuresToColumn(units, measures).filter(
    (d) => d.measurement == parameter
  );
  const points = unnestPoints(refMeasures);

  return h(
    IsotopesDataArea,
    {
      getHeight(d) {
        return d.age;
      },
    } as any,
    h(
      "g.data-points",
      points.map((d) => {
        return h(IsotopeDataPoint, {
          datum: d,
          fill: color,
        });
      })
    )
  );
}

function IsotopesColumn(
  props: IsotopeColumnProps & { children?: React.ReactNode } & AxisProps<any>
) {
  const {
    width = 120,
    domain = [-14, 6],
    parameter,
    label,
    color = "dodgerblue",
    children = null,
    transform,
    getHeight,
    ...rest
  } = props;

  const { sections, totalHeight } = useMacrostratColumnData();

  let _children: any = children;
  if (children == null && parameter != null) {
    _children = h(IsotopesDataset, { parameter, color, getHeight });
  }

  return h(
    SVG,
    {
      height: totalHeight,
      innerWidth: width,
      paddingH: 15,
    },
    h(
      CrossAxisLayoutProvider,
      { width, domain },
      h("g.isotopes-column", { className: parameter, transform }, [
        h(ColumnScale, { label: label ?? parameter, ...rest }),
        _children,
      ])
    )
  );
}

export { IsotopesColumn, IsotopesDataset };
