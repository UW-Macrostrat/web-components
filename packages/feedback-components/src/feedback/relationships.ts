import type { TreeData } from "./types";

export type RelationshipID = string | number;

/** A directed edge. Entity IDs are independent of paragraph offsets. */
export interface Relationship {
  id: RelationshipID;
  source: number;
  dest: number;
  relationship_type: string | null;
  relationship_type_id?: number | null;
}

export interface RelationshipType {
  id?: number;
  name: string;
  description?: string | null;
}

/** Visit each entity once, even when the input repeats it under two parents. */
export function uniqueEntities(tree: TreeData[]): TreeData[] {
  const result = new Map<number, TreeData>();
  for (const node of entityOccurrences(tree)) {
    if (!result.has(node.id)) result.set(node.id, node);
  }
  return [...result.values()];
}

/** Explicit outgoing relationships take precedence over legacy children.
 * An explicit empty list means there are no edges; do not infer old ones. */
export function relationshipsFromTree(tree: TreeData[]): Relationship[] {
  // A repeated entity can expose different outgoing edges at each occurrence.
  const nodes = entityOccurrences(tree);
  let edges: Relationship[];
  if (nodes.some((node) => node.relationships != null)) {
    edges = nodes.flatMap((node) => node.relationships ?? []);
  } else {
    edges = nodes.flatMap((node) =>
      (node.children ?? []).map((child) => ({
        id: `legacy:${node.id}:${child.id}`,
        source: node.id,
        dest: child.id,
        relationship_type: null,
      })),
    );
  }
  return [...new Map(edges.map((edge) => [edge.id, edge])).values()];
}

/** Attach JSON-safe edge metadata for existing onSave(tree) consumers.
 * treeToGraph reads these edges instead of reconstructing a tree topology. */
export function treeWithRelationships(
  tree: TreeData[],
  relationships: Relationship[],
): TreeData[] {
  const outgoing = new Map<number, Relationship[]>();
  for (const edge of relationships) {
    const edges = outgoing.get(edge.source) ?? [];
    edges.push({ ...edge });
    outgoing.set(edge.source, edges);
  }
  const visit = (nodes: TreeData[]): TreeData[] =>
    nodes.map((node) => ({
      ...node,
      relationships: outgoing.get(node.id) ?? [],
      children: visit(node.children ?? []),
    }));
  return visit(tree);
}

export function relationshipError(
  edge: Relationship,
  nodes: TreeData[],
  edges: Relationship[],
  replacing?: RelationshipID,
): string | null {
  const ids = new Set(uniqueEntities(nodes).map((node) => node.id));
  if (!ids.has(edge.source) || !ids.has(edge.dest)) {
    return "Choose an existing source and target entity.";
  }
  if (!edge.relationship_type?.trim()) return "Choose a relationship type.";
  if (
    edges.some(
      (other) => other.id !== replacing && sameRelationship(edge, other),
    )
  ) {
    return "This directed relationship already exists.";
  }
  return null;
}

export function sameRelationship(a: Relationship, b: Relationship): boolean {
  return (
    a.source === b.source &&
    a.dest === b.dest &&
    a.relationship_type === b.relationship_type &&
    (a.relationship_type_id ?? null) === (b.relationship_type_id ?? null)
  );
}

function entityOccurrences(tree: TreeData[]): TreeData[] {
  const nodes: TreeData[] = [];
  const visited = new Set<TreeData>();
  const stack = [...tree].reverse();
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (visited.has(node)) continue;
    visited.add(node);
    nodes.push(node);
    stack.push(...[...(node.children ?? [])].reverse());
  }
  return nodes;
}
