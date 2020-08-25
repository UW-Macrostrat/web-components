import h from "@macrostrat/hyper";
import { Axis } from "@vx/axis";
import { TimescaleOrientation } from "./types";
import { useTimescale } from "./provider";

function AgeAxis() {
  const ctx = useTimescale();
  const { scale, length, orientation } = ctx;
  if (!scale) return null;

  const margin = 20;

  const isHorizontal = orientation == TimescaleOrientation.HORIZONTAL;

  const size = isHorizontal
    ? { height: 200, width: length + 2 * margin }
    : { width: 200, height: length + 2 * margin };

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
      ...axProps,
      scale,
      numTicks: Math.floor(length / 50),
      tickLabelProps(/** tickValue, index */) {
        return {
          dy: isHorizontal ? null : "0.3em",
          dx: isHorizontal ? null : "1.6em",
          textAnchor: "middle",
          fontSize: 10,
          fill: "#222",
        };
      },
    })
  );
}

export { AgeAxis };
