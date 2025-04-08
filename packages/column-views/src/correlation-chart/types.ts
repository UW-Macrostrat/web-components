import { UnitLong } from "@macrostrat/api-types";

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

export type ColumnUnitIndex = Map<ColumnID, UnitLong[]>;

export interface GapBoundPackage extends AgeComparable {
  unitIndex: ColumnUnitIndex;
}

export interface SectionRenderData extends AgeComparable {
  columnID: ColumnID;
  units: UnitLong[];
  bestPixelScale: number;
}
