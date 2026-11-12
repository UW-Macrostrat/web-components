import type { Entity, Relationship } from "../src";
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

/** Quartz is shared by sandstone and shale: two incoming connections,
 * one entity, with no relationship vocabulary required. */
export const kgRelationships: Relationship[] = [
  { id: "r1", source: 1, dest: 2 },
  { id: "r2", source: 1, dest: 3 },
  { id: "r3", source: 2, dest: 4 },
  { id: "r4", source: 3, dest: 4 },
  { id: "r5", source: 2, dest: 5 },
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
