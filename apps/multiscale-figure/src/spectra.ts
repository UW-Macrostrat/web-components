import h from "@macrostrat/hyper";
import {
  useColumnDivisions,
  StaticNotesColumn
} from "@macrostrat/column-components";
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

function IsotopesSpectrumPlot(props) {
  const { children } = props;
  let minmax = [-10, 10];
  const delta = minmax[1] - minmax[0];
  //minmax = [minmax[0] - bandwidth * 4, minmax[1] + bandwidth * 4]

  const margin = 10;
  const marginTop = 30;
  const marginBottom = 50;
  const innerWidth = 300;
  const eachHeight = 60;
  const height = eachHeight + marginTop + marginBottom;
  const width = innerWidth + 2 * margin;

  const xScale = scaleLinear({
    range: [0, width],
    domain: minmax
  });

  let label = "Age (Ma)";
  let tickFormat = d => d;
  if (delta > 1000) {
    label = "Age (Ga)";
    tickFormat = d => d / 1000;
  }

  const labelProps = { label };

  const id = "gradient_1";

  const value = {
    width: innerWidth,
    height: eachHeight,
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
          transform: `translate(${margin},${marginTop})`
        },
        [
          h(AxisBottom, {
            scale: xScale,
            numTicks: 10,
            tickLength: 4,
            tickFormat,
            strokeWidth: 1.5,
            top: eachHeight,
            ...labelProps
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
  return h(IsotopesSpectrumPlot, null, h(IsotopesSeries, { data: values }));
}

function IsotopeSpectrumNote(props: { note: { data: IUnit } }) {
  const { note } = props;
  return h("div.isotopes-note", [
    h(IsotopesSpectrum, { unit_id: note.data.unit_id, parameter: "D13C" })
  ]);
}

function IsotopesSpectraColumn(props: { children?: React.ReactNode }) {
  const divisions = useColumnDivisions();
  const notes = useMemo(() => {
    return divisions.map(d => {
      return { note: `${d.unit_id}`, height: d.b_age, top_height: d.t_age };
    });
  }, [divisions]);

  console.log(divisions);
  return h([
    h(
      "g",
      divisions.map(d => {
        return h(IsotopesSpectrum, { unit_id: d.unit_id, parameter: "D13C" });
      })
    ),
    h(StaticNotesColumn, {
      transform: "translate(140,0)",
      width: 100,
      notes: []
    })
  ]);
}

export { IsotopesSpectraColumn, IsotopeSpectrumNote };
