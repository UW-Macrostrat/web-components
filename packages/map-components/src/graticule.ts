import h from "./hyper";
import { geoGraticule } from "d3-geo";
import { GeoPath } from "./context";
import { MultiLineString } from "geojson";

function useGraticule(step = 10): MultiLineString {
  return geoGraticule()
    .step([step, step])
    .extent([
      [-180, -90 + step],
      [180, 90 - step + 1e-6],
    ])();
}

function Graticule(props) {
  const geometry = useGraticule();
  return h(GeoPath, {
    className: "graticule",
    geometry,
    ...props,
  });
}

export { useGraticule, Graticule };
