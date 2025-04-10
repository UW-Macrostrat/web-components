import { geoCentroid } from "d3-geo";
import { geoVoronoi } from "d3-geo-voronoi";

export function buildKeyMapping(
  neighbors,
  centroids,
  currentIndex,
  projection
) {
  if (neighbors == null) return;

  const currentCentroid = projection(centroids[currentIndex]);

  let edgeAngles = neighbors.map((index) => {
    const centroid = projection(centroids[index]);
    const dx = centroid[0] - currentCentroid[0];
    const dy = centroid[1] - currentCentroid[1];
    return { col_index: index, angle: Math.atan2(dy, dx) };
  });

  edgeAngles.sort((d) => d.angle);

  function closestAngle(num) {
    // Find closest angle in array of neighbors
    let curr = edgeAngles[0];
    for (let next of edgeAngles) {
      if (
        Math.abs(normalize(num - next.angle)) <
        Math.abs(normalize(num - curr.angle))
      ) {
        curr = next;
      }
    }
    return curr.col_index;
  }

  return {
    37: closestAngle(Math.PI), // left
    38: closestAngle((3 * Math.PI) / 2), // up
    39: closestAngle(0), // right
    40: closestAngle(Math.PI / 2), // down
  };
}

function normalize(angle) {
  if (angle > Math.PI) {
    angle -= 2 * Math.PI;
  } else if (angle <= -Math.PI) {
    angle += 2 * Math.PI;
  }
  return angle;
}

export function buildTriangulation(features) {
  const centroids = features.map(geoCentroid);
  const tri = geoVoronoi(centroids);
  return { centroids, tri };
}
