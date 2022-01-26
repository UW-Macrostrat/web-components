import { ColumnAxisType } from "@macrostrat/column-components";
export interface IUnit {
  unit_id: number;
  col_id: number;
  section_id: number;
  t_age: number;
  b_age: number;
  [x: string]: any;
}

enum MacrostratAxisKey {
  AGE = "age",
  POS = "pos"
}

function transformAxisType(t: ColumnAxisType): MacrostratAxisKey {
  switch (t) {
    case "age":
      return MacrostratAxisKey.AGE;
    case "height":
    case "depth":
      return MacrostratAxisKey.POS;
  }
}

export { MacrostratAxisKey, transformAxisType };
