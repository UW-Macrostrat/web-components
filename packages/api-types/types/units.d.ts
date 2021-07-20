export interface BaseUnit {
  unit_id: number;
  b_age: number;
  t_age: number;
}

export interface StratUnit {
  unit_id: number;
  unit_name: string;
  strat_name_id: number;
  strat_name_long: string;
}

export interface Environment {
  class: string;
  type: string;
  name: string;
  environ_id: number;
}

export interface Lithology {
  atts?: string[];
  name: string;
  prop: number;
  lith_id: number;
  type: string;
  class: string;
}

export interface MeasureInfo {
  measure_class: string;
  measure_type: string;
}

export interface UnitLong extends BaseUnit, StratUnit {
  section_id: number;
  col_id: number;
  project_id: number;
  col_area: number;
  Mbr: string;
  Fm: string;
  Gp: string;
  SGp: string;
  max_thick: number;
  min_thick: number;
  outcrop: string;
  pbdb_collections: number;
  pbdb_occurrences: number;
  lith?: Lithology[];
  environ?: Environment[];
  econ?: any[];
  measure?: MeasureInfo[];
  notes: string;
  color: string;
  text_color: string;
  t_int_id: number;
  t_int_name: string;
  t_int_age: number;
  t_prop: number;
  units_above?: number[] | null;
  b_int_id: number;
  b_int_name: string;
  b_int_age: number;
  b_prop: number;
  units_below?: number[] | null;
  refs?: number[] | null;
  clat: number;
  clng: number;
  t_plat: number;
  t_plng: number;
  b_plat: number;
  b_plng: number;
}
