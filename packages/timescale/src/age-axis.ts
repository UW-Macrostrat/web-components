import h from "./main.module.sass";
import { Axis, TickLabelProps } from "@visx/axis";
import { TimescaleOrientation } from "./types";
import { useTimescale } from "./provider";
import { CSSProperties } from "react";
import { AxisProps } from "@visx/axis/lib/axis/Axis";

type AgeAxisProps = {
  width?: number;
  margin?: number;
};

function AgeAxis(props: AgeAxisProps) {
  const ctx = useTimescale();
  if (ctx == null) return null;
  const { scale, length, orientation } = ctx;
  if (!scale) return null;
  const { margin = 20 } = props;

  const isHorizontal = orientation == TimescaleOrientation.HORIZONTAL;

  let width = props.width ?? 25;
  let height = 25;

  let style: CSSProperties = {};
  let axisProps: AxisProps<any> = {
    scale: scale as any,
    numTicks: Math.floor(length / 50),
  };

  let tickLabelProps: TickLabelProps<any> = {
    fontSize: 10,
    fill: "var(--text-color)",
    textAnchor: "middle",
  };

  const outerSize = length + 2 * margin;
  if (isHorizontal) {
    width = outerSize;
    style.marginLeft = -margin;
    style.marginRight = -margin;
    axisProps.left = margin;
    axisProps.orientation = "bottom";
  } else {
    height = outerSize;
    style.marginTop = -margin;
    style.marginBottom = -margin;
    axisProps.top = margin;
    axisProps.left = width - 1;
    axisProps.orientation = "left";
    axisProps.scale.range([length, 0]);
    tickLabelProps.dy = -8;
    tickLabelProps.dx = "-1em";
  }

  return h(
    "svg.timescale-axis",
    { width, height, style },
    h(Axis, {
      tickLabelProps(tickValue, index) {
        let transform: string | null = null;
        if (!isHorizontal) {
          transform = `rotate(-90 0,${scale(tickValue)})`;
        }

        return {
          ...tickLabelProps,
          transform,
        };
      },
      stroke: "var(--text-color)",
      tickStroke: "var(--text-color)",
      ...axisProps,
      ...props,
    }),
  );
}

export { AgeAxis, AgeAxisProps };
