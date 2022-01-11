import h from "./hyper";
import { geoGraticule } from "d3-geo";
import { GeoPath } from "./context";
import { MultiLineString } from "geojson";

type GraticuleStepSize = number | [number, number];
type GraticuleProps =
  | { stepSize?: GraticuleStepSize }
  | Omit<React.ComponentProps<typeof GeoPath>, "geometry">;

function useGraticule(stepSize: GraticuleStepSize = 10): MultiLineString {
  const steps: [number, number] = Array.isArray(stepSize) ? stepSize : [stepSize, stepSize];
  return geoGraticule()
    .step(steps)
    .extent([
      [-180, -90 + steps[1]],
      [180, 90 - steps[1] + 1e-6],
    ])();
}

function Graticule({ stepSize, ...rest }: GraticuleProps) {
  const geometry = useGraticule(stepSize);
  return h(GeoPath, {
    className: "graticule",
    geometry,
    ...rest,
  });
}

export { useGraticule, Graticule };
