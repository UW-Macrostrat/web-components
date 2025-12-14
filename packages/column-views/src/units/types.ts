export interface IUnit {
  unit_id: number;
  col_id: number;
  section_id: number;
  t_age: number;
  b_age: number;
  [x: string]: any;
  patternID?: string | number;
  color?: string;
}

export interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CompositeColumnScale {
  (val: number): number;
  copy(): CompositeColumnScale;
  domain(): number[];
}
