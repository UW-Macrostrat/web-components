import { createContext, useContext, ReactNode } from "react";
import hyper from "@macrostrat/hyper";
import { scaleLinear } from "@visx/scale";
import { AreaClosed } from "@visx/shape";
import { AxisBottom } from "@visx/axis";
import { max } from "d3-array";
import gradients from "./gradients";
import {
  kernelDensityEstimator,
  kernelEpanechnikov,
  kernelGaussian,
} from "./kernel-density";
import {
  ScaleLinear,
  ScaleLogarithmic,
  ScalePower,
  ScaleRadial,
  ScaleTime,
  ScaleQuantize,
} from "@visx/vendor/d3-scale";
import styles from "./index.module.sass";
import { expandInnerSize, InnerSizeProps } from "@macrostrat/ui-components";

const h = hyper.styled(styles);

export { kernelDensityEstimator, kernelEpanechnikov, kernelGaussian };

type ContinuousScale =
  | ScaleLinear<number, number>
  | ScaleLogarithmic<number, number>
  | ScalePower<number, number>
  | ScaleRadial<number, number>
  | ScaleTime<number, number>
  | ScaleQuantize<number>;

interface PlotAreaCtx {
  xScale: ContinuousScale;
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
  accessor?: (d: any) => number;
  color?: string;
  bandwidth?: number;
  filled?: boolean;
}

const noOp = (d) => d;

function DetritalSeries(props: DetritalSeriesProps) {
  const {
    data,
    accessor = noOp,
    bandwidth = 60,
    color = "magenta",
    filled = true,
  } = props;
  if (data == null) {
    return null;
  }

  const { height, xScale } = useContext(PlotAreaContext);

  const xTicks = xScale.ticks(400);
  const kde = kernelDensityEstimator(kernelGaussian(bandwidth), xTicks);
  const kdeData = kde(data.map(accessor));

  // All KDEs should have same height
  const maxProbability: number = max(kdeData, (d: [number, number]) => d[1]);

  const yScale = scaleLinear({
    range: [height, 0],
    domain: [0, maxProbability],
  });

  let colorProps: object = {
    fill: "transparent",
  };
  if (filled) {
    colorProps = { fill: color, fillOpacity: 0.2 };
  }

  return h(AreaClosed, {
    data: kdeData,
    yScale,
    x(d) {
      return xScale(d[0]);
    },
    y(d) {
      return yScale(d[1]);
    },
    stroke: color,
    ...colorProps,
    //fill: `url(#${id})`
  });
}

interface DetritalSpectrumProps extends InnerSizeProps {
  children: ReactNode;
  showAxisLabels?: boolean;
}

function DetritalSpectrumPlot(props: DetritalSpectrumProps) {
  const { children, showAxisLabels = true, ...sizeProps } = props;
  let minmax = [0, 4000]; // extent(data, accessor);
  const delta = minmax[1] - minmax[0];
  //minmax = [minmax[0] - bandwidth * 4, minmax[1] + bandwidth * 4]

  const ez = expandInnerSize(
    {
      padding: 10,
      paddingBottom: showAxisLabels ? 40 : undefined,
      innerHeight: 60,
      width: 300,
      ...sizeProps,
    },
    false,
  );

  const { width, height, paddingLeft, paddingTop, innerWidth, innerHeight } =
    ez;

  const xScale = scaleLinear({
    range: [0, innerWidth],
    domain: minmax,
  });

  let label = "Age (Ma)";
  let tickFormat = (d) => d;
  if (delta > 1000) {
    label = "Age (Ga)";
    tickFormat = (d) => d / 1000;
  }

  const fill = "var(--text-color)";
  const labelProps = { fill };

  const id = "gradient_1";

  const value = {
    width: innerWidth,
    height: innerHeight,
    xScale,
  };

  return h(
    PlotAreaContext.Provider,
    { value },
    h("svg.detrital-spectrum-plot", { width, height }, [
      h(
        "g",
        {
          transform: `translate(${paddingLeft},${paddingTop})`,
        },
        [
          h(gradients[0], { id }),
          h(AxisBottom, {
            scale: xScale,
            numTicks: 10,
            tickLength: 4,
            tickFormat,
            strokeWidth: 1.5,
            top: innerHeight + 1,
            tickStroke: fill,
            stroke: fill,
            tickLabelProps: {
              fill,
            },
            label,
            labelProps,
          }),
          children,
        ],
      ),
    ]),
  );
}

export { DetritalSpectrumPlot, DetritalSeries, usePlotArea, PlotAreaContext };
