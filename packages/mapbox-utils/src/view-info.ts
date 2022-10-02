import { MapPosition } from "./position";

export interface MapViewInfo {
  mapIsRotated: boolean;
  mapUse3D: boolean;
  mapIsGlobal: boolean;
}

export function mapViewInfo(mapPosition: MapPosition): MapViewInfo {
  // Switch to 3D mode at high zoom levels or with a rotated map
  const pitch = mapPosition.camera.pitch ?? 0;
  const bearing = mapPosition.camera.bearing ?? 0;
  const alt = mapPosition.camera.altitude ?? 10000000;
  const mapIsRotated = pitch != 0 || bearing != 0;

  const mapIsGlobal = alt > 1600000;

  let mapUse3D = false;
  if (alt != null) {
    mapUse3D = (pitch > 0 && alt < 200000) || alt < 80000;
  }

  return {
    mapIsRotated,
    mapUse3D,
    mapIsGlobal,
  };
}
