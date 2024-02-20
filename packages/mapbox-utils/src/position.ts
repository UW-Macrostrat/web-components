/** Utilities for dealing with map coordinates. */
import { FreeCameraOptions, Map, MercatorCoordinate } from "mapbox-gl";

export type LatLng = {
  lng: number;
  lat: number;
};

type TargetPosition = LatLng & {
  zoom: number;
};

type CameraPosition = LatLng & {
  bearing?: number;
  pitch?: number;
  altitude: number;
};

export type MapPosition = {
  camera: CameraPosition;
  target?: TargetPosition;
};

export function getMapPosition(map: Map): MapPosition {
  const pos = map.getFreeCameraOptions();
  const cameraPos = pos.position.toLngLat();
  let center = map.getCenter();
  return {
    camera: {
      ...cameraPos,
      altitude: pos.position.toAltitude(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    },
    target: {
      ...center,
      zoom: map.getZoom(),
    },
  };
}

export function setMapPosition(map: Map, pos: MapPosition) {
  const { pitch = 0, bearing = 0, altitude } = pos.camera;
  const zoom = pos.target?.zoom;
  if (zoom != null && altitude == null && pitch == 0 && bearing == 0) {
    const { lng, lat } = pos.target;
    // Zoom must be set before center to correctly recall position
    map.setZoom(zoom);
    map.setCenter([lng, lat]);
  } else {
    const { altitude, lng, lat } = pos.camera;
    const cameraOptions = new FreeCameraOptions(
      MercatorCoordinate.fromLngLat({ lng, lat }, altitude),
      [0, 0, 0, 1]
    );
    cameraOptions.setPitchBearing(pitch, bearing);
    map.setFreeCameraOptions(cameraOptions);
  }
}
