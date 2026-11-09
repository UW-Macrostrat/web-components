import type { Entity, Relationship, RelationshipType } from "../src";
import type { EntityType } from "../src/extractions/types";

/** Synthetic data for UI testing, not a geological interpretation. */
export const kgText =
  "The Gowganda Formation contains sandstone and shale. Quartz occurs in sandstone and in shale. The sandstone is laminated.";

export const kgEntityTypes = new Map<number, EntityType>([
  [1, { id: 1, name: "strat_name", color: "#e2c281" }],
  [2, { id: 2, name: "lith", color: "#80c991" }],
  [3, { id: 3, name: "mineral", color: "#9fbbec" }],
  [4, { id: 4, name: "lith_att", color: "#d7a9de" }],
]);

export const kgEntities: Entity[] = [
  entity(1, "Gowganda Formation", 1),
  entity(2, "sandstone", 2, {
    lith_id: 10,
    entity_type: "lithology",
    name: "sandstone",
  }),
  entity(3, "shale", 2),
  entity(4, "Quartz", 3),
  entity(5, "laminated", 4),
];

// Example vocabulary IDs, not production relationship_type IDs.
export const kgRelationshipTypes: RelationshipType[] = [
  { id: 1, name: "strat_name_to_lith", description: "Formation has lithology" },
  { id: 2, name: "lith_to_mineral", description: "Lithology contains mineral" },
  {
    id: 3,
    name: "mineral_occurs_in",
    description: "Mineral occurs in formation",
  },
  { id: 4, name: "lith_to_attribute", description: "Lithology has attribute" },
  { id: 5, name: "co_occurs_with", description: "Entities occur together" },
  {
    id: 6,
    name: "same_unit_as",
    description: "Merged mentions refer to the same unit",
  },
];

export const kgRelationships: Relationship[] = [
  edge("r1", 1, 2, 1),
  edge("r2", 1, 3, 1),
  edge("r3", 2, 4, 2),
  edge("r4", 3, 4, 2), // Quartz has two incoming parents.
  edge("r5", 4, 1, 3), // Completes 1 -> 2 -> 4 -> 1.
  edge("r6", 2, 5, 4),
  edge("r7", 2, 3, 5),
  edge("r8", 3, 2, 5), // Reciprocal arrows must remain distinguishable.
  edge("r9", 2, 2, 6), // Self loop after combining repeated mentions.
  edge("r10", 2, 4, 5), // Another type on the same directed pair.
];

function entity(id: number, name: string, type: number, match?: any): Entity {
  const spans: [number, number][] = [];
  let start = kgText.indexOf(name);
  while (start >= 0) {
    spans.push([start, start + name.length]);
    start = kgText.indexOf(name, start + name.length);
  }
  return { id, name, type, indices: spans[0], spans, children: [], match };
}

function edge(
  id: string,
  source: number,
  dest: number,
  typeId: number,
): Relationship {
  const type = kgRelationshipTypes.find((type) => type.id === typeId)!;
  return {
    id,
    source,
    dest,
    relationship_type: type.name,
    relationship_type_id: type.id,
  };
}
