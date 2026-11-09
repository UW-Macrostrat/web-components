import type { Relationship } from "./relationships";

export interface Point {
  x: number;
  y: number;
}
export const NODE_WIDTH = 150;
export const NODE_HEIGHT = 48;

/** Deterministic positions, independent of edge edits and selection. */
export function initialPositions(ids: number[]): Map<number, Point> {
  const radius = Math.max(180, ids.length * 35);
  return new Map(
    ids.map((id, index) => {
      const angle =
        (index * Math.PI * 2) / Math.max(1, ids.length) - Math.PI / 2;
      return [
        id,
        {
          x: radius + 170 + radius * Math.cos(angle),
          y: radius + 130 + radius * Math.sin(angle),
        },
      ];
    }),
  );
}

/** Separate reciprocal/parallel edges and draw self loops outside the node. */
export function edgeGeometry(
  edge: Relationship,
  edges: Relationship[],
  positions: Map<number, Point>,
) {
  const source = positions.get(edge.source);
  const dest = positions.get(edge.dest);
  if (!source || !dest) return null;
  const siblings = edges.filter(
    (other) =>
      (other.source === edge.source && other.dest === edge.dest) ||
      (other.source === edge.dest && other.dest === edge.source),
  );
  const index = siblings.findIndex((other) => other.id === edge.id);
  if (edge.source === edge.dest) {
    const lift = 90 + index * 35;
    return {
      path: `M ${source.x - 32} ${source.y - 24} C ${source.x - 100} ${source.y - lift}, ${source.x + 100} ${source.y - lift}, ${source.x + 32} ${source.y - 24}`,
      label: { x: source.x, y: source.y - lift * 0.75 - 6 },
    };
  }
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
    label: {
      x: (start.x + 2 * control.x + end.x) / 4,
      y: (start.y + 2 * control.y + end.y) / 4 - 6,
    },
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
