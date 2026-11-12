import type { TreeData } from "./types";

export interface GraphPosition {
  x: number;
  y: number;
}

export type GraphPositions = Record<number, GraphPosition>;

/** `dest` retains the existing treeToGraph API's endpoint spelling. */
export interface GraphRelationship {
  id: string | number;
  source: number;
  dest: number;
  name: string;
  relationship_type_id?: number | null;
  [field: string]: unknown;
}

export type GraphRelationshipInput = Omit<GraphRelationship, "id" | "name"> & {
  source: number;
  dest: number;
  id?: string | number;
  name?: string;
};

export interface EntityOutput {
  id: number;
  type: number | null;
  type_name: string | null;
  txt_range: number[][];
  name: string;
  match: any | null;
  reasoning: string | null;
  color: string | null;
  children: any[] | null;
}

export interface GraphData {
  nodes: EntityOutput[];
  edges: GraphRelationship[];
  positions?: GraphPositions;
}

/** A global visited set makes shared entities one vertex, across all depths. */
export function treeToGraph(tree: TreeData[]): GraphData {
  const nodes: EntityOutput[] = [];
  const edges: GraphRelationship[] = [];
  const seenNodes = new Set<number>();
  const seenEdges = new Set<string>();
  const expanded = new Set<TreeData>();
  function visit(items: TreeData[]) {
    for (const node of items) {
      if (expanded.has(node)) continue;
      expanded.add(node);
      if (!seenNodes.has(node.id)) {
        seenNodes.add(node.id);
        nodes.push({
          id: node.id,
          type: node.type?.id ?? null,
          type_name: node.type?.name ?? null,
          color: node.type?.color ?? null,
          name: node.name,
          txt_range: node.spans?.length ? node.spans : [node.indices],
          reasoning: null,
          match: node.match,
          children: node.children,
        });
      }
      for (const child of node.children ?? []) {
        const id = `tree:${node.id}:${child.id}`;
        if (seenEdges.has(id)) continue;
        seenEdges.add(id);
        edges.push({ id, source: node.id, dest: child.id, name: "has_child" });
      }
      visit(node.children ?? []);
    }
  }
  visit(tree);
  return { nodes, edges };
}

export function normalizeRelationships(
  tree: TreeData[],
  relationships?: GraphRelationshipInput[],
): GraphRelationship[] {
  const graph = treeToGraph(tree);
  if (relationships == null) return graph.edges;
  const nodes = new Set(graph.nodes.map((node) => node.id));
  const ids = new Set<string>();
  return relationships.map((edge, index) => {
    if (!nodes.has(edge.source) || !nodes.has(edge.dest)) {
      throw new Error(
        "A graph relationship refers to an entity outside this run.",
      );
    }
    const id = edge.id ?? `edge:${index}:${edge.source}:${edge.dest}`;
    if (ids.has(String(id)))
      throw new Error(`Duplicate relationship ID: ${id}`);
    ids.add(String(id));
    return { ...edge, id, name: edge.name ?? "has_child" };
  });
}

/** A deterministic layout; cycles are visited once, never recursively laid out. */
export function arrangeGraph(
  tree: TreeData[],
  edges: GraphRelationship[],
): GraphPositions {
  const nodes = treeToGraph(tree).nodes;
  const adjacent = new Map(nodes.map((node) => [node.id, [] as number[]]));
  const children = new Set<number>();
  for (const edge of edges) {
    adjacent.get(edge.source)?.push(edge.dest);
    children.add(edge.dest);
  }
  const levels = new Map<number, number>();
  function visit(id: number) {
    if (levels.has(id)) return;
    levels.set(id, 0);
    const queue = [id];
    for (let i = 0; i < queue.length; i++) {
      for (const child of adjacent.get(queue[i]) ?? []) {
        if (levels.has(child)) continue;
        levels.set(child, (levels.get(queue[i]) ?? 0) + 1);
        queue.push(child);
      }
    }
  }
  nodes
    .filter((node) => !children.has(node.id))
    .forEach((node) => visit(node.id));
  nodes.forEach((node) => visit(node.id));
  const rows = new Map<number, number>();
  return Object.fromEntries(
    nodes.map((node) => {
      const level = levels.get(node.id) ?? 0;
      const row = rows.get(level) ?? 0;
      rows.set(level, row + 1);
      return [node.id, { x: 140 + level * 280, y: 100 + row * 130 }];
    }),
  );
}

export function reconcileRelationships(
  before: TreeData[],
  after: TreeData[],
  edges: GraphRelationship[],
): GraphRelationship[] {
  const previous = treeToGraph(before);
  const next = treeToGraph(after);
  const nodes = new Set(next.nodes.map((node) => node.id));
  const pair = (edge: GraphRelationship) => `${edge.source}:${edge.dest}`;
  const oldPairs = new Set(previous.edges.map(pair));
  const newPairs = new Set(next.edges.map(pair));
  // Tree reparenting updates corresponding edges; unrelated graph edits survive.
  const result = edges.filter(
    (edge) =>
      nodes.has(edge.source) &&
      nodes.has(edge.dest) &&
      (!oldPairs.has(pair(edge)) || newPairs.has(pair(edge))),
  );
  const pairs = new Set(result.map(pair));
  const ids = new Set(result.map((edge) => String(edge.id)));
  for (const edge of next.edges) {
    if (oldPairs.has(pair(edge)) || pairs.has(pair(edge))) continue;
    let id = String(edge.id);
    while (ids.has(id)) id += ":new";
    result.push({ ...edge, id });
    ids.add(id);
  }
  return result;
}

export function retainPositions(
  tree: TreeData[],
  edges: GraphRelationship[],
  positions: GraphPositions,
): GraphPositions {
  const layout = arrangeGraph(tree, edges);
  for (const id of Object.keys(layout)) {
    const point = positions[id];
    if (Number.isFinite(point?.x) && Number.isFinite(point?.y))
      layout[id] = point;
  }
  return layout;
}
