import type { Relationship } from "./relationships";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
} from "d3-force";

export interface Point {
  x: number;
  y: number;
}
export const NODE_WIDTH = 150;
export const NODE_HEIGHT = 48;

/** Compact, deterministic layout. Work in scaled coordinates so collision
 * spacing matches wide rectangular labels rather than large circles. */
export function initialPositions(
  ids: number[],
  edges: Relationship[] = [],
  aspectRatio = 1.5,
): Map<number, Point> {
  const xUnit = 90;
  const yUnit = 38;
  const ordered = [...new Set(ids)].sort((a, b) => a - b);
  const columns = Math.max(
    1,
    Math.ceil(Math.sqrt((ordered.length * aspectRatio * yUnit) / xUnit)),
  );
  const nodes = ordered.map((id, i) => ({
    id,
    x: ((i % columns) - (columns - 1) / 2) * 2.4,
    y:
      (Math.floor(i / columns) - Math.ceil(ordered.length / columns) / 2) * 2.4,
  }));
  const known = new Set(ordered);
  const links = edges
    .filter(
      (edge) =>
        edge.source !== edge.dest &&
        known.has(edge.source) &&
        known.has(edge.dest),
    )
    .map((edge) => ({ source: edge.source, target: edge.dest }));
  const simulation = forceSimulation(nodes)
    .force(
      "link",
      forceLink(links)
        .id((node: any) => node.id)
        .distance(2.8)
        .strength(0.6),
    )
    .force("charge", forceManyBody().strength(-0.8).distanceMax(15))
    .force("x", forceX(0).strength(0.045 / Math.max(0.5, aspectRatio)))
    .force("y", forceY(0).strength(0.045 * Math.max(0.5, aspectRatio)))
    .force("collision", forceCollide(1.2).iterations(3))
    .stop();
  simulation.tick(180);
  return new Map(
    nodes.map((node) => [node.id, { x: node.x * xUnit, y: node.y * yUnit }]),
  );
}

export interface Camera extends Point {
  scale: number;
}
export const MIN_SCALE = 0.001;
export const MAX_SCALE = 4;

/** Pixel position under the pointer remains fixed while zooming. */
export function zoomCamera(
  camera: Camera,
  factor: number,
  anchor: Point,
): Camera {
  const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, camera.scale * factor));
  return {
    scale,
    x: camera.x + anchor.x / camera.scale - anchor.x / scale,
    y: camera.y + anchor.y / camera.scale - anchor.y / scale,
  };
}

export function panCamera(camera: Camera, delta: Point): Camera {
  return {
    ...camera,
    x: camera.x - delta.x / camera.scale,
    y: camera.y - delta.y / camera.scale,
  };
}

/** Fit all nodes, or just the selected subset, with padding in screen pixels. */
export function fitCamera(
  points: Iterable<Point>,
  width: number,
  height: number,
  maxScale = 1,
): Camera {
  const values = [...points];
  if (!values.length) return { x: -width / 2, y: -height / 2, scale: 1 };
  const left = Math.min(...values.map((p) => p.x)) - NODE_WIDTH / 2;
  const right = Math.max(...values.map((p) => p.x)) + NODE_WIDTH / 2;
  const top = Math.min(...values.map((p) => p.y)) - NODE_HEIGHT / 2;
  const bottom = Math.max(...values.map((p) => p.y)) + NODE_HEIGHT / 2;
  const scale = Math.max(
    MIN_SCALE,
    Math.min(
      maxScale,
      MAX_SCALE,
      Math.max(1, width - 48) / (right - left),
      Math.max(1, height - 48) / (bottom - top),
    ),
  );
  return {
    scale,
    x: (left + right) / 2 - width / (2 * scale),
    y: (top + bottom) / 2 - height / (2 * scale),
  };
}

/** Draw connections between distinct entities; self loops have no geometry. */
export function edgeGeometry(
  edge: Relationship,
  edges: Relationship[],
  positions: Map<number, Point>,
) {
  const source = positions.get(edge.source);
  const dest = positions.get(edge.dest);
  if (!source || !dest || edge.source === edge.dest) return null;
  const siblings = edges.filter(
    (other) =>
      (other.source === edge.source && other.dest === edge.dest) ||
      (other.source === edge.dest && other.dest === edge.source),
  );
  const index = siblings.findIndex((other) => other.id === edge.id);
  const dx = dest.x - source.x;
  const dy = dest.y - source.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  // Use the same normal for both directions so their curves cannot coincide.
  let direction = 1;
  if (edge.source > edge.dest) direction = -1;
  const bend = (index - (siblings.length - 1) / 2) * 80;
  const control = {
    x: (source.x + dest.x) / 2 - (dy / length) * bend * direction,
    y: (source.y + dest.y) / 2 + (dx / length) * bend * direction,
  };
  const start = boundary(source, control);
  const end = boundary(dest, control);
  return {
    path: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
  };
}

function boundary(center: Point, toward: Point): Point {
  const dx = toward.x - center.x;
  const dy = toward.y - center.y;
  const scale = Math.min(
    (NODE_WIDTH / 2 + 4) / Math.max(Math.abs(dx), 0.001),
    (NODE_HEIGHT / 2 + 4) / Math.max(Math.abs(dy), 0.001),
  );
  return { x: center.x + dx * scale, y: center.y + dy * scale };
}
