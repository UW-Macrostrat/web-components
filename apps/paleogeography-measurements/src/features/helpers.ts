import { geoContains } from "d3-geo";
import Supercluster from "supercluster";

export function intersectFeatures(polygons, points) {
  let output = [];
  for (const pt of points) {
    for (const plate of polygons) {
      if (geoContains(plate, [pt.lng, pt.lat])) {
        const { old_lim, plate_id, young_lim } = plate.properties;
        output.push({
          ...pt,
          old_lim,
          plate_id,
          young_lim
        });
        break;
      }
    }
  }
  return output;
}

export function clusterPoints(data, zoomLevel = 4, opts = {}) {
  const cluster = new Supercluster({
    radius: 20,
    ...opts
  });
  cluster.load(data);
  return cluster.getClusters([-180, -90, 180, 90], zoomLevel);
}
