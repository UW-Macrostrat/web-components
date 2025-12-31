import {
  LatLng,
  MapPosition,
  formatCoordForZoomLevel,
} from "@macrostrat/mapbox-utils";
import { ParsedQuery } from "query-string";

interface LocationHashParams {
  x?: string;
  y?: string;
  z?: string;
  a?: string;
  e?: string;
}

const fmt1 = (x: number) => x.toFixed(1);
const fmt2 = (x: number) => x.toFixed(2);
const fmtInt = (x: number) => Math.round(x).toString();

export function applyMapPositionToHash(
  args: LocationHashParams,
  mapPosition: MapPosition | null,
) {
  const pos = mapPosition?.camera;
  if (pos == null) return;
  const zoom = mapPosition.target?.zoom;

  args.x = formatCoordForZoomLevel(pos.lng, zoom);
  args.y = formatCoordForZoomLevel(pos.lat, zoom);

  if (pos.bearing == 0 && pos.pitch == 0 && zoom != null) {
    args.z = fmt1(zoom);
  } else if (pos.altitude != null) {
    if (pos.altitude > 5000) {
      args.z = fmt2(pos.altitude / 1000) + "km";
    } else {
      args.z = fmtInt(pos.altitude) + "m";
    }
  }
  if (pos.bearing != 0) {
    let az = pos.bearing;
    if (az < 0) az += 360;
    args.a = fmtInt(az);
  }
  if (pos.pitch != 0) {
    args.e = fmtInt(pos.pitch);
  }
}

function _fmt(x: string | number | string[]) {
  if (Array.isArray(x)) {
    x = x[0];
  }
  return parseFloat(x.toString());
}

export function getMapPositionForHash(
  hashData: ParsedQuery<string>,
  centerPosition: LatLng | null,
): MapPosition {
  const {
    x = centerPosition?.lng ?? 0,
    y = centerPosition?.lat ?? 0,
    // Different default for zoom depending on whether we have a marker
    z = centerPosition != null ? 7 : 2,
    a = 0,
    e = 0,
  } = hashData;

  const lng = _fmt(x);
  const lat = _fmt(y);

  let altitude = null;
  let zoom = null;
  const _z = z.toString();
  if (_z.endsWith("km")) {
    altitude = _fmt(_z.substring(0, _z.length - 2)) * 1000;
  } else if (_z.endsWith("m")) {
    altitude = _fmt(_z.substring(0, _z.length - 1));
  } else {
    zoom = _fmt(z);
  }
  const bearing = _fmt(a);
  const pitch = _fmt(e);

  let target = undefined;
  if (bearing == 0 && pitch == 0 && zoom != null) {
    target = {
      lat,
      lng,
      zoom,
    };
  }

  return {
    camera: {
      lng: _fmt(x),
      lat: _fmt(y),
      altitude,
      bearing: _fmt(a),
      pitch: _fmt(e),
    },
    target,
  };
}
