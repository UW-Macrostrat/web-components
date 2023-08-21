import { format } from "d3-format";

export function formatCoordForZoomLevel(val: number, zoom: number): string {
  if (zoom < 2) {
    return fmt1(val);
  } else if (zoom < 4) {
    return fmt2(val);
  } else if (zoom < 7) {
    return fmt3(val);
  }
  return fmt4(val);
}

export function normalizeLng(lng) {
  // via https://github.com/Leaflet/Leaflet/blob/32c9156cb1d1c9bd53130639ec4d8575fbeef5a6/src/core/Util.js#L87
  return (((((lng - 180) % 360) + 360) % 360) - 180).toFixed(4);
}

export const fmt4 = format(".4~f");
export const fmt3 = format(".3~f");
export const fmt2 = format(".2~f");
export const fmt1 = format(".1~f");
export const fmtInt = format(".0f");

export function formatValue(val: number, precision: number = 0): string {
  switch (precision) {
    case 4:
      return fmt4(val);
    case 3:
      return fmt3(val);
    case 2:
      return fmt2(val);
    case 1:
      return fmt1(val);
    case 0:
      return fmtInt(val);
    default:
      return fmt4(val);
  }
}

export function metersToFeet(meters, precision = 0) {
  return (meters * 3.28084).toFixed(precision);
}
