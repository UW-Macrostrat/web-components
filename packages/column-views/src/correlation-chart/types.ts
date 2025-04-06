import { UnitLong } from "@macrostrat/api-types";

export interface ColumnIdentifier {
  col_id: number;
  col_name: string;
  project_id: number;
}

export interface CorrelationChartData {
  t_age: number;
  b_age: number;
  columnData: SectionRenderData[][]; // Units for each column
}

export interface AgeComparable {
  b_age: number;
  t_age: number;
}

export interface CorrelatedGapBoundPackage extends AgeComparable {
  units: UnitLong[][];
  bestPixelScale: number;
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
