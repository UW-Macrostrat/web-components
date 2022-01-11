/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { geoPath } from "d3-geo";
import { Shapes, Intersection, ShapeInfo } from "kld-intersections";
import { PathParser } from "kld-path-parser";
import { LineString } from "geojson";
import PathHandler from "kld-intersections/lib/PathHandler";
import { useMap } from "./context";
import { useGraticule } from "./graticule";
import h from "./hyper";

const index = { lon: 0, lat: 1 };

const formatAzimuthLabel = function (d) {
  const v = 180 - d.value;
  if (v === 180) {
    return "S";
  }
  if (v === 90) {
    return "E";
  }
  if (v === 0) {
    return "N";
  }
  if (v === 270) {
    return "W";
  }
  return `${v}°`;
};

enum CoordAxis {
  Longitude = 0,
  Latitude = 1,
}

type PixelCoord = { x: number; y: number };
type ShapeData = { shape?: Shapes.Shape } & { start?: PixelCoord; end?: PixelCoord };
type IntersectionData = { axis: CoordAxis } & ShapeData;

type IntersectionResult = PixelCoord & { value: number };

function useIntersections({ axis, shape, start, end }: IntersectionData): IntersectionResult[] {
  shape ??= Shapes.line(start.x, start.y, end.x, end.y);
  const { coordinates, type } = useGraticule();
  const { projection } = useMap();
  const pth = geoPath(projection);
  const intersections = [];
  const values = coordinates.filter((d) => d[0][axis] === d[1][axis]);
  for (const coords of Array.from(values)) {
    const obj: LineString = { type: "LineString", coordinates: coords };
    const d = pth(obj);
    if (d == null) continue;
    const path = ShapeInfo.path(d);

    const { points } = Intersection.intersect(path, shape);
    for (let point of Array.from(points)) {
      point.value = coords[0][axis];
      intersections.push(point);
    }
  }
  return intersections;
}

class _GraticuleLabels {
  static initClass() {
    this.prototype.type = "lat";
    this.prototype.showCircles = false;
    this.prototype._offs = [0, 0];
    this.prototype._rot = 0;
    this.prototype.labelText = "Latitude";
  }
  constructor(stereonet) {
    this.stereonet = stereonet;
  }
  format(d) {
    return `${d.value}°`;
  }
  alongLine(startPos, endPos) {
    this.shape = Shapes.line(...startPos, ...endPos);
    return this;
  }

  textOffset(offs) {
    if (offs == null) {
      return this._offs;
    }
    this._offs = offs;
    return this;
  }

  textRotation(rot) {
    if (rot == null) {
      return this._rot;
    }
    this._rot = rot;
    return this;
  }

  getIntersections() {
    const { coordinates, type } = this.stereonet.graticule()();
    const pth = geoPath(this.stereonet.projection());
    const ix = index[this.type];
    const intersections = [];
    const values = coordinates.filter((d) => d[0][ix] === d[1][ix]);
    for (let coords of Array.from(values)) {
      const obj = { type: "LineString", coordinates: coords };
      const d = pth(obj);
      const parser = new PathParser();
      const handler = new PathHandler();
      parser.setHandler(handler);
      try {
        parser.parseData(d);
      } catch (error) {
        continue;
      }
      const path = Shapes.path(handler.shapes);
      const { points } = Intersection.intersect(path, this.shape);
      for (let point of Array.from(points)) {
        point.value = coords[0][ix];
        console.log(point);
        intersections.push(point);
      }
    }
    return intersections;
  }

  render(el) {
    this.container = el.append("g.labels");
    const sel = this.container
      .appendMany("g.label", this.getIntersections())
      .translate(({ x, y }) => [x, y])
      .attrs({
        "text-anchor": "middle",
        "alignment-baseline": "middle",
      });

    sel
      .append("text")
      .text(this.format)
      .attr("transform", `translate(${this._offs[0]},${this._offs[1]}) rotate(${this._rot})`);

    if (this.showCircles) {
      sel.append("circle").attr("r", 2);
    }

    return sel;
  }

  renderLabel(pos) {
    if (pos == null) {
      pos = [0, 0];
    }
    return this.container
      .append("text.axis-label")
      .attr("transform", `translate(${pos[0]}, ${pos[1]}) rotate(${this._rot})`)
      .attr("text-anchor", "middle")
      .text(this.labelText);
  }
}

class _AzimuthLabels extends GraticuleLabels {
  static initClass() {
    this.prototype.type = "lon";
    this.prototype.labelText = "Dip azimuth";
    this.prototype.format = formatAzimuthLabel;
  }
}

class _DipLabels extends GraticuleLabels {
  static initClass() {
    this.prototype.type = "lat";
    this.prototype.labelText = "Dip";
  }
  format(d) {
    const v = 90 - d.value;
    return `${v}°`;
  }
}

export function GraticuleLabels({ formatValue }) {
  formatValue ??= (d) => `${d}°`;
  const intersections = useIntersections({
    axis: CoordAxis.Latitude,
    start: { x: 0, y: 0 },
    end: { x: 500, y: 500 },
  });
  return h(
    "g.labels",
    intersections.map((d) => {
      const { x, y, value } = d;
      return h("g.label", [h("text", { transform: `translate(${x} ${y})` }, formatValue(value))]);
    })
  );
}
