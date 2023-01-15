import { Map } from "mapbox-gl";
import { useMapRef } from "./context";
import { useEffect } from "react";

export interface DebugOptions {
  showTileBoundaries?: boolean;
  showTerrainWireframe?: boolean;
  showCollisionBoxes?: boolean;
}

export function MapDebugger({
  mapRef,
  ...rest
}: DebugOptions & { mapRef: React.RefObject<Map> }) {
  const {
    showTileBoundaries = false,
    showTerrainWireframe = false,
    showCollisionBoxes = false,
  } = rest;

  const ref = mapRef ?? useMapRef();

  useEffect(() => {
    const map = ref.current;
    if (map == null) return;
    map.showTileBoundaries = showTileBoundaries;
    map.showTerrainWireframe = showTerrainWireframe;
    map.showCollisionBoxes = showCollisionBoxes;
    map.triggerRepaint();
  }, [
    ref.current,
    showTileBoundaries,
    showTerrainWireframe,
    showCollisionBoxes,
  ]);
  return null;
}
