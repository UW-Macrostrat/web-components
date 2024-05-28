import { Component, createElement, createContext, useContext } from "react";
import h from "@macrostrat/hyper";
import { scaleLinear } from "@vx/scale";
import { AreaClosed } from "@vx/shape";
import { AxisLeft, AxisBottom, AxisScale } from "@vx/axis";
import { extent, min, max, histogram } from "d3-array";
import gradients from "./gradients";
import {
  kernelDensityEstimator,
  kernelEpanechnikov,
  kernelGaussian,
} from "./kernel-density";

export { kernelDensityEstimator, kernelEpanechnikov, kernelGaussian };

interface PlotAreaCtx {
  xScale: AxisScale;
  width: number;
  height: number;
}

const PlotAreaContext = createContext<PlotAreaCtx>({
  width: 200,
  height: 50,
  xScale: scaleLinear({
    range: [0, 200],
    domain: [0, 4000],
  }),
});

const usePlotArea = () => useContext(PlotAreaContext);

interface DetritalSeriesProps {
  data: number[];
  accessor: (d: any) => number;
}

const noOp = (d) => d;

function DetritalSeries(props: DetritalSeriesProps) {
  const { data, accessor = noOp, bandwidth = 60 } = props;
  if (data == null) {
    return null;
  }

  const { height, xScale } = useContext(PlotAreaContext);

  const xTicks = xScale.ticks(400);
  const kde = kernelDensityEstimator(kernelGaussian(bandwidth), xTicks);
  const kdeData = kde(data.map(accessor));

  // All KDEs should have same height
  const maxProbability = max(kdeData, (d) => d[1]);

  const yScale = scaleLinear({
    range: [height, 0],
    domain: [0, maxProbability],
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
    fill: "transparent",
    //fill: `url(#${id})`
  });
}

function DetritalSpectrumPlot(props) {
  const { children } = props;
  let minmax = [0, 4000]; // extent(data, accessor);
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
    domain: minmax,
  });

  let label = "Age (Ma)";
  let tickFormat = (d) => d;
  if (delta > 1000) {
    label = "Age (Ga)";
    tickFormat = (d) => d / 1000;
  }

  const labelProps = { label };

  const id = "gradient_1";

  const value = {
    width: innerWidth,
    height: eachHeight,
    xScale,
  };

  return h(
    PlotAreaContext.Provider,
    { value },
    h("svg", { width, height }, [
      h(
        "g",
        {
          transform: `translate(${margin},${marginTop})`,
        },
        [
          h(gradients[0], { id }),
          h(AxisBottom, {
            scale: xScale,
            numTicks: 10,
            tickLength: 4,
            tickFormat,
            strokeWidth: 1.5,
            top: eachHeight,
            ...labelProps,
          }),
          children,
        ]
      ),
    ])
  );
}

export { DetritalSpectrumPlot, DetritalSeries, usePlotArea, PlotAreaContext };
