type EntityType = {
  name: string;
  color: string;
  id: number;
  description?: string;
};
type Match = any;

export interface Entity {
  id: number;
  name: string;
  type?: number;
  indices: [number, number];
  children: Entity[];
  match?: Match;
}

export { EntityType };

export type Highlight = {
  start: number;
  end: number;
  tag?: string;
  text?: string;
  backgroundColor?: string;
  borderColor?: string;
  id: number;
  parents?: number[];
  match?: Match;
};

export interface EntityExt extends Omit<Entity, "type" | "children"> {
  type: EntityType;
  children: EntityExt[];
  parents?: number[];
}
