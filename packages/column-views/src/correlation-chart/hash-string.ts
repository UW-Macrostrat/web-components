import { LineString } from "geojson";

export function parseLineFromString(section: string): LineString | null {
  /* Section should be specified as space-separated coordinates */
  if (section == null || typeof section !== "string") {
    return null;
  }

  try {
    let coords = section.split(" ").map(parseCoordinates);
    return {
      type: "LineString",
      coordinates: coords,
    };
  } catch (e) {
    console.warn(e);
    return null;
  }
}

export function stringifyLine(line: LineString | null): string | null {
  if (
    line == null ||
    line.type !== "LineString" ||
    line.coordinates.length < 2
  ) {
    return null;
  }
  return line.coordinates
    .map((coord) => coord.map(stringifyNumber).join(","))
    .join(" ");
}

function parseCoordinates(s: string): [number, number] {
  let [x, y] = s.split(",").map(parseNumber);
  if (x == null || y == null || isNaN(x) || isNaN(y)) {
    throw new Error("Invalid coordinate string");
  }
  if (x > 180 || x < -180 || y > 90 || y < -90) {
    throw new Error("Invalid coordinate value");
  }
  return [x, y];
}

function parseNumber(s: string): number {
  let s1 = s;
  // For some reason, we sometimes get en-dashes in the hash string
  if (s1[0] == "−") {
    s1 = "-" + s1.slice(1);
  }
  return Number(s1);
}

const stringifyNumber = (d) =>
  d.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
