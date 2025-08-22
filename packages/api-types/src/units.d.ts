import type { LithologyCore } from "./lithologies.d";

export interface BaseUnit {
  unit_id: number;
  b_age: number;
  t_age: number;
  t_pos?: number;
  b_pos?: number;
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

export interface UnitLithology extends LithologyCore {
  atts?: string[];
  prop: number;
}

export interface MeasureInfo {
  measure_class: string;
  measure_type: string;
}

export interface UnitLong extends BaseUnit, StratUnit {
  section_id: number;
  col_id: number;
  project_id: number;
  max_thick: number;
  min_thick: number;
  outcrop: string;
  Mbr: string;
  Fm: string;
  Gp: string;
  SGp: string;
  lith?: UnitLithology[];
  environ?: Environment[];
  econ?: any[];
  notes: string;
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
  // positions are formatted as strings in the v2 API
  // need to pass show_position=true to get these
  b_pos?: number;
  t_pos?: number;
}

export interface UnitLongFull extends UnitLong {
  col_area: number;
  pbdb_collections: number;
  pbdb_occurrences: number;
  measure?: MeasureInfo[];
  color: string;
  text_color: string;
  clat: number;
  clng: number;
  t_plat: number;
  t_plng: number;
  b_plat: number;
  b_plng: number;
  b_pos?: number | string;
  t_pos?: number | string;
}

export interface StratName {
  strat_name: string;
  strat_name_long: string;
  rank: string;
  strat_name_id: number;
  concept_id: number;
  bed: string;
  bed_id: number;
  mbr: string;
  mbr_id: number;
  fm: string;
  fm_id: number;
  subgp: string;
  subgp_id: number;
  gp: string;
  gp_id: number;
  sgp: string;
  sgp_id: number;
  b_age: string;
  t_age: string;
  b_period: string;
  t_period: string;
  c_interval: string;
  t_units: number;
  ref_id: number;
}

export interface StratNameConcept {
  concept_id: number;
  name: string;
  geologic_age: string;
  int_id: string;
  b_int_id: string;
  t_int_id: string;
  usage_notes: string;
  other: string;
  province: string;
  refs: string;
  url: string;
  author: string;
}
