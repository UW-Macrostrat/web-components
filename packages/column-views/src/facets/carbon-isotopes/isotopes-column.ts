import { useMemo } from "react";
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
  SVG,
  ColumnLayoutProvider,
  useColumnLayout,
} from "@macrostrat/column-components";
import {
  useMacrostratColumnData,
  useMacrostratUnits,
} from "../../data-provider";
import styles from "./isotopes-column.module.sass";
import { scaleLinear } from "d3-scale";

const h = hyper.styled(styles);

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

  const { xScale } = useColumnLayout();
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
  nTicks?: number;
  showAxis?: boolean;
}

function IsotopesDataset(props) {
  const { parameter, color = "dodgerblue" } = props;
  const units = useMacrostratUnits();
  const measures = useMeasurementData() ?? [];

  const points = useMemo(() => {
    const data = measures.filter((d) => d.measurement === parameter);
    const refMeasures = referenceMeasuresToColumn(units, data);
    return unnestPoints(refMeasures);
  }, [measures, parameter, units]);

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
  props: IsotopeColumnProps & { children?: React.ReactNode }
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
    showAxis = true,
    tickValues: _tickVals,
    nTicks = 6,
    ...rest
  } = props;

  const { totalHeight } = useMacrostratColumnData();

  let _children: any = children;
  if (children == null && parameter != null) {
    _children = h(IsotopesDataset, { parameter, color, getHeight });
  }

  const xScale = useMemo(
    () => scaleLinear().domain(domain).range([0, width]),
    [domain, width]
  );

  const tickValues = _tickVals ?? xScale.ticks(nTicks);

  return h("div.isotopes-column", [
    h(
      SVG,
      {
        height: totalHeight,
        innerWidth: width,
        paddingH: 15,
      },
      h(
        ColumnLayoutProvider,
        { width, xScale },
        h("g.isotopes-column", { className: parameter, transform }, [
          h(ColumnScaleLines, {
            xScale,
            tickValues,
            width,
            ...rest,
          }),
          _children,
        ])
      )
    ),
    h.if(showAxis)(ColumnScaleAxis, {
      width,
      label: label ?? parameter,
      xScale,
      tickValues,
      ...rest,
    }),
  ]);
}

function ColumnScaleAxis(props) {
  const { label, xScale, width, showAxis = true, tickValues, ...rest } = props;

  return h("div.isotopes-scale-axis", [
    h(
      SVG,
      {
        innerWidth: width,
        height: 45,
        paddingH: 15,
      },
      [
        h(AxisBottom, {
          scale: xScale,
          tickLength: 5,
          tickValues,
          stroke: "var(--column-stroke-color)",
          tickStroke: "var(--column-stroke-color)",
          ...rest,
          label,
        }),
      ]
    ),
  ]);
}

function ColumnScaleLines(props) {
  const { tickValues, xScale } = props;

  return h(
    "g.scale-lines",
    tickValues.map((value) => {
      return h(ScaleLine, { value });
    })
  );
}

export { IsotopesColumn, IsotopesDataset };
