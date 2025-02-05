import { format } from "d3-format";
import { useContext } from "react";
import h from "@macrostrat/hyper";
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
  useColumnDivisions,
} from "@macrostrat/column-components";

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
  const { xScale, pixelHeight, width } = useContext(ColumnLayoutContext);

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
        y: pixelHeight,
        width,
        height: 30,
      }),
      h(AxisBottom, {
        scale: xScale,
        tickLength: 3,
        tickValues,
        ...rest,
        top: pixelHeight,
        tickLabelProps(tickValue, i) {
          // Compensate for negative sign
          let dx;
          if (tickValue < 0) {
            dx = -2;
          }
          return {
            dy: "-1px",
            dx,
            fontSize: 10,
            textAnchor: "middle",
            fill: "#aaa",
          };
        },
        labelOffset: 0,
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
}

function ScaleLine(props: ScaleLineProps) {
  let { value, className, labelBottom, labelOffset, ...rest } = props;
  if (labelBottom == null) {
    labelBottom = false;
  }
  if (labelOffset == null) {
    labelOffset = 12;
  }
  const { xScale, pixelHeight } = useContext(ColumnLayoutContext);
  const x = xScale(value);
  const transform = `translate(${x})`;
  className = classNames(className, { zero: value === 0 });
  return h("g.tick", { transform, className, key: value }, [
    h("line", { x0: 0, x1: 0, y0: 0, y1: pixelHeight, ...rest }),
    h.if(labelBottom)("text", { y: pixelHeight + labelOffset }, `${value}`),
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
}

function IsotopesDataset(props) {
  const { parameter, color = "dodgerblue" } = props;
  const divisions = useColumnDivisions();
  const measures = useMeasurementData() ?? [];
  const refMeasures = referenceMeasuresToColumn(divisions, measures).filter(
    (d) => d.measurement == parameter
  );
  const points = unnestPoints(refMeasures);

  return h(
    IsotopesDataArea,
    {
      getHeight(d) {
        return d.age;
      },
    },
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
    ...rest
  } = props;

  let _children = children;
  if (children == null && parameter != null) {
    _children = h(IsotopesDataset, { parameter, color, getHeight });
  }

  return h(
    CrossAxisLayoutProvider,
    { width, domain },
    h("g.isotopes-column", { className: parameter, transform }, [
      h(ColumnScale, { label: label ?? parameter, ...rest }),
      _children,
    ])
  );
}

export { IsotopesColumn, IsotopesDataset };
