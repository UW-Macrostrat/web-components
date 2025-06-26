import { scaleLinear, scaleOrdinal } from "d3-scale";
import { useColumnLayout } from "./context";
import h from "@macrostrat/hyper";

const grainSizes = ["ms", "s", "vf", "f", "m", "c", "vc", "p"];
const createGrainsizeScale = function (range) {
  /** A basic grainsize scale that will work in many situations */

  const scale = scaleLinear()
    .domain([0, grainSizes.length - 1])
    .range(range);
  const tickPositions = grainSizes.map((d, i) => scale(i));
  return scaleOrdinal().domain(grainSizes).range(tickPositions);
};

function GrainsizeAxis({ height = 20 }) {
  const { grainsizeScale: gs, pixelHeight } = useColumnLayout();
  if (gs == null) {
    throw "GrainsizeAxis must be a child of a GrainsizeScaleProvider";
  }
  const sizes = (gs as any).domain();

  // check length of sizes and rotate labels if necessary
  let strlen = sizes.reduce((acc, d) => acc + d.length, 0) / sizes.length;
  let className = "";
  if (strlen > 2) {
    className = "rotated";
  }

  return h(
    "g.grainsize.axis",
    { className },
    sizes.map((d) => {
      return h("g.tick", { transform: `translate(${gs(d)} 0)`, key: d }, [
        h("text.top", { y: 0 }, d),
        h(
          "text.bottom",
          { y: pixelHeight, style: { transformOrigin: `0 ${pixelHeight}px` } },
          d,
        ),
        h("line", { y1: 0, x1: 0, x2: 0, y2: pixelHeight }),
      ]);
    }),
  );
}

export { GrainsizeAxis, grainSizes, createGrainsizeScale };
