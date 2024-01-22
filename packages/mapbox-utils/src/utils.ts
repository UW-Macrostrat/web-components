export function formatCoordForZoomLevel(val: number, zoom: number): string {
  return val.toFixed(trailingDigitsForZoom(zoom));
}

function trailingDigitsForZoom(zoom: number): number {
  if (zoom < 2) {
    return 1;
  } else if (zoom < 4) {
    return 2;
  } else if (zoom < 7) {
    return 3;
  } else {
    return 4;
  }
}

export function normalizeLng(lng) {
  // via https://github.com/Leaflet/Leaflet/blob/32c9156cb1d1c9bd53130639ec4d8575fbeef5a6/src/core/Util.js#L87
  return (((((lng - 180) % 360) + 360) % 360) - 180).toFixed(4);
}

export function metersToFeet(meters, precision = 0) {
  return (meters * 3.28084).toFixed(precision);
}
