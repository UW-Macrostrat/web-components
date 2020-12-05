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
  kernelGaussian
} from "./kernel-density";

interface DetritalPlotCtx {
  width: number;
  height: number;
}

function DetritalAgeSpectrum(props) {
  const { data, dataAccessor } = props;
  if (data == null) {
    return null;
  }

  const accessor = dataAccessor;

  let minmax = [0, 4000]; // extent(data, accessor);
  const delta = minmax[1] - minmax[0];
  const bandwidth = 60; //delta / 50;
  minmax = [minmax[0] - bandwidth * 4, minmax[1] + bandwidth * 4];

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

  const xTicks = xScale.ticks(400);
  const kde = kernelDensityEstimator(kernelGaussian(bandwidth), xTicks);
  const kdeData = kde(data.map(accessor));

  // All KDEs should have same height
  const maxProbability = max(kdeData, d => d[1]);

  const yScale = scaleLinear({
    range: [eachHeight, 0],
    domain: [0, maxProbability]
  });

  const labelProps = { label };

  const id = "gradient_1";

  return h("svg", { width, height }, [
    h(
      "g",
      {
        transform: `translate(${margin},${marginTop})`
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
          ...labelProps
        }),
        h(AreaClosed, {
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
        }),
        createElement(
          "foreignObject",
          { x: 0, y: -20, width: 500, height: 50 },
          h("h4", null, [`${data.length} grains`])
        )
      ]
    )
  ]);
}

export { DetritalAgeSpectrum };
