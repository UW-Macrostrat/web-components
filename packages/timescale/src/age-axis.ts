import h from "@macrostrat/hyper";
import { AxisBottom, AxisRight } from "@vx/axis";
import { useTimescale } from "./provider";

function AgeAxis() {
  const ctx = useTimescale();
  const { scale, length } = ctx;
  if (!scale) return null;

  return h("svg", { width: 200, height: length }, [
    h(AxisRight, {
      scale: scale,
      numTicks: Math.floor(length / 50),
    }),
  ]);
}

export { AgeAxis };
