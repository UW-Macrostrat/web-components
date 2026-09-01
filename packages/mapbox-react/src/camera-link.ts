/** Bind the cameras of several maps together, so that moving any one of them
 * moves the others. */
import { useEffect } from "react";
import type { Map } from "mapbox-gl";

/** Keep two maps' cameras locked together, for as long as both exist. */
export function useLinkedMapCameras(a: Map | null, b: Map | null) {
  useEffect(() => {
    if (a == null || b == null) return;
    return linkMapCameras(a, b);
  }, [a, b]);
}

/** Lock several maps' cameras together, returning a function that unlinks them.
 * The first map is treated as the leader for the initial alignment; after that
 * the link is symmetric.
 */
export function linkMapCameras(...maps: Map[]): () => void {
  /* Each map's handler detaches every listener before propagating its camera,
     so an update pushed to one map can't echo back and cycle between them. */
  const handlers = maps.map((source) => () => {
    stop();
    for (const target of maps) {
      if (target !== source) copyMapCamera(source, target);
    }
    start();
  });

  function start() {
    maps.forEach((map, i) => map.on("move", handlers[i]));
  }

  function stop() {
    maps.forEach((map, i) => map.off("move", handlers[i]));
  }

  const [leader, ...followers] = maps;
  for (const target of followers) {
    copyMapCamera(leader, target);
  }
  start();
  return stop;
}

/** Copy one map's camera exactly onto another.
 *
 * This uses the free-camera API rather than center/zoom/bearing/pitch, so it
 * stays exact for pitched and 3D views, and is unaffected by the maps having
 * different padding.
 */
export function copyMapCamera(source: Map, target: Map) {
  target.setFreeCameraOptions(source.getFreeCameraOptions());
}
