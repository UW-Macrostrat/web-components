import h from "@macrostrat/hyper";
import { Axis } from "@vx/axis";
import { TimescaleOrientation } from "./types";
import { useTimescale } from "./provider";

type AgeAxisProps = any;

function AgeAxis(props: AgeAxisProps) {
  const ctx = useTimescale();
  const { scale, length, orientation } = ctx;
  if (!scale) return null;

  const margin = 20;

  const isHorizontal = orientation == TimescaleOrientation.HORIZONTAL;

  const size = isHorizontal
    ? { height: 20, width: length + 2 * margin }
    : { width: 20, height: length + 2 * margin };

  const style = isHorizontal
    ? { marginLeft: -margin, marginRight: -margin }
    : {
        marginTop: -margin,
        marginBottom: -margin,
      };

  const axProps = isHorizontal
    ? { orientation: "bottom", left: margin }
    : { orientation: "right", top: margin };

  return h(
    "svg.timescale-axis",
    { ...size, style },
    h(Axis, {
      scale,
      numTicks: Math.floor(length / 50),
      tickLabelProps(tickValue, index) {
        const vertProps = isHorizontal
          ? {}
          : {
              dy: "1em",
              dx: "2em",
              transform: `rotate(-90 0,${scale(tickValue)})`,
            };

        return {
          ...vertProps,
          textAnchor: "middle",
          fontSize: 10,
          fill: "#222",
        };
      },
      ...axProps,
      ...props,
    })
  );
}

export { AgeAxis, AgeAxisProps };
