import h from "@macrostrat/hyper";
import {
  useColumnDivisions,
  Padding,
  extractPadding
} from "@macrostrat/column-components";
import { AnnotatedUnitsColumn } from "common/units/composite";
import { useMeasurementData } from "../../carbon-isotopes/data-provider";
import { createContext, useContext, useMemo } from "react";
import { scaleLinear } from "@vx/scale";
import { AreaClosed } from "@vx/shape";
import { AxisBottom, AxisScale } from "@vx/axis";
import { max } from "d3-array";
import {
  kernelDensityEstimator,
  kernelGaussian
} from "common/dz-spectrum/kernel-density";
import { IUnit } from "common/units/types";
import { PlotAreaContext, usePlotArea } from "common/dz-spectrum/index";

interface IsotopesSeriesProps {
  data: number[];
  accessor: (d: any) => number;
}

const noOp = d => d;

function IsotopesSeries(props: IsotopesSeriesProps) {
  const { data, accessor = noOp, bandwidth = 0.5 } = props;
  if (data == null) {
    return null;
  }

  const { height, xScale } = useContext(PlotAreaContext);

  const xTicks = xScale.ticks(400);
  const kde = kernelDensityEstimator(kernelGaussian(bandwidth), xTicks);
  const kdeData = kde(data.map(accessor));

  // All KDEs should have same height
  const maxProbability = max(kdeData, d => d[1]);

  const yScale = scaleLinear({
    range: [height, 0],
    domain: [0, maxProbability]
  });

  return h(AreaClosed, {
    data: kdeData,
    yScale,
    x(d) {
      return xScale(d[0]);
    },
    y(d) {
      return yScale(d[1]);
    },
    stroke: "magenta",
    fill: "transparent"
    //fill: `url(#${id})`
  });
}

interface IsotopesPlotProps extends Partial<Padding> {
  children?: React.ReactNode;
  width: number;
  height: number;
  label: string;
  tickFormat?: (d: number) => string;
}

function IsotopesSpectrumPlot(props: IsotopesPlotProps) {
  const {
    children,
    width = 300,
    height = 60,
    label,
    tickFormat = d => d,
    ...rest
  } = props;

  const {
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom
  } = extractPadding({ paddingBottom: 18, padding: 5, ...rest });

  let minmax = [-10, 10];
  const delta = minmax[1] - minmax[0];
  //minmax = [minmax[0] - bandwidth * 4, minmax[1] + bandwidth * 4]

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  const xScale = scaleLinear({
    range: [0, innerWidth],
    domain: minmax
  });

  const labelProps = { label };

  const id = "gradient_1";

  const value = {
    width: innerWidth,
    height: innerHeight,
    xScale
  };

  return h(
    PlotAreaContext.Provider,
    { value },
    h(
      "svg",
      { width, height },
      h(
        "g",
        {
          transform: `translate(${paddingLeft},${paddingTop})`
        },
        [
          h(AxisBottom, {
            scale: xScale,
            numTicks: 10,
            tickLength: 4,
            tickFormat,
            strokeWidth: 1.5,
            top: innerHeight,
            label
          }),
          children
        ]
      )
    )
  );
}

function getMeasureValues(measures) {
  let res = [];
  for (const meas of measures) {
    res = res.concat(meas.measure_value);
  }
  return res;
}

function IsotopesSpectrum({
  unit_id,
  parameter
}: {
  unit_id: number;
  parameter: string;
}) {
  const measures = useMeasurementData() ?? [];
  const unitMeasures = measures.filter(
    d => d.unit_id == unit_id && d.measurement == parameter
  );
  console.log(unitMeasures);

  const values = getMeasureValues(unitMeasures);
  if (values.length < 1) {
    return null;
  }
  return h(
    IsotopesSpectrumPlot,
    { width: 140, height: 50, label: "Isotope value" },
    h(IsotopesSeries, { data: values })
  );
}

function IsotopeSpectrumNote(props: { note: { data: IUnit } }) {
  const { note } = props;
  return h("div.isotopes-note", [
    h(IsotopesSpectrum, { unit_id: note.data.unit_id, parameter: "D13C" })
  ]);
}

function IsotopesSpectraColumn(props: {
  children?: React.ReactNode;
  parameter: string;
}) {
  const { parameter = "D13C" } = props;
  const measures = useMeasurementData() ?? [];

  return h(AnnotatedUnitsColumn, {
    width: 400,
    columnWidth: 140,
    gutterWidth: 0,
    noteComponent: IsotopeSpectrumNote,
    shouldRenderNote(div: IUnit) {
      const unitMeasures = measures.filter(
        d => d.unit_id == div.unit_id && d.measurement == parameter
      );
      console.log(unitMeasures);
      return unitMeasures.length > 0;
    }
  });
}

export { IsotopesSpectraColumn, IsotopeSpectrumNote };
