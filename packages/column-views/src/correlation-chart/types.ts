import { UnitLong } from "@macrostrat/api-types";
import { ExtUnit } from "../prepare-units/helpers";

export interface ColumnIdentifier {
  col_id: number;
  col_name: string;
  project_id: number;
}

export interface AgeComparable {
  b_age: number;
  t_age: number;
}

type ColumnID = number;

export type ColumnUnitIndex = Map<ColumnID, ExtUnit[]>;

export interface GapBoundPackage extends AgeComparable {
  unitIndex: ColumnUnitIndex;
}

export interface SectionRenderData extends AgeComparable {
  columnID: ColumnID;
  units: UnitLong[];
  bestPixelScale: number;
}
