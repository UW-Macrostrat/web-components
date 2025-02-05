import h from "./hyper";
import { Axis } from "@visx/axis";
import { TimescaleOrientation } from "./types";
import { useTimescale } from "./provider";

type AgeAxisProps = {
  width: number;
  margin: number;
};

function AgeAxis(props: AgeAxisProps) {
  const ctx = useTimescale();
  const { scale, length, orientation } = ctx;
  if (!scale) return null;
  const { width, margin } = props;

  const isHorizontal = orientation == TimescaleOrientation.HORIZONTAL;

  const size = isHorizontal
    ? { height: width, width: length + 2 * margin }
    : { width: width, height: length + 2 * margin };

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

AgeAxis.defaultProps = {
  width: 25,
  margin: 20,
};

export { AgeAxis, AgeAxisProps };
