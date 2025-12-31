import { CompositeStratigraphicScaleInfo } from "../age-axis";
import { ColumnAxisType } from "@macrostrat/column-components";
import { type ColumnGeoJSONRecord, UnitLong } from "@macrostrat/api-types";
import {
  MergeSectionsMode,
  PrepareColumnOptions,
  prepareColumnUnits,
  preprocessUnits,
} from "../prepare-units";
import { mergeAgeRanges } from "@macrostrat/stratigraphy-utils";
import { PackageLayoutData } from "../prepare-units/types";

export interface ColumnIdentifier {
  col_id: number;
  col_name: string;
  project_id: number;
}

interface ColumnData {
  columnID: number;
  units: UnitLong[];
}

export interface CorrelationChartSettings extends Omit<
  PrepareColumnOptions,
  "axisType"
> {
  targetUnitHeight?: number;
}

export interface CorrelationChartData {
  packages: MultiColumnPackageData[];
  scaleInfo: CompositeStratigraphicScaleInfo;
  nColumns: number;
}

export interface ColumnIdentifier {
  col_id: number;
  col_name: string;
  project_id: number;
}

export function buildCorrelationChartData(
  columns: ColumnData[],
  settings: CorrelationChartSettings,
): CorrelationChartData {
  console.log(settings);
  const {
    mergeSections = MergeSectionsMode.OVERLAPPING,
    targetUnitHeight,
    ...rest
  } = settings;

  const opts: PrepareColumnOptions = {
    axisType: ColumnAxisType.AGE,
    targetUnitHeight,
    mergeSections,
    ...rest,
  };

  if (columns.length == 0) {
    return null;
  }

  // Flatten the units array to pretend that all units are in the same column
  const _units = columns.map((d) => d.units).flat();

  const columnIDs = columns.map((d) => d.columnID);

  const preparedUnits = prepareColumnUnits(_units, opts);

  const { sections, totalHeight } = preparedUnits;

  const scaleInfo: CompositeStratigraphicScaleInfo = {
    axisType: ColumnAxisType.AGE,
    totalHeight,
    packages: sections.map((d) => d.scaleInfo),
  };

  const packages = sections.map((d) => {
    return separateColumns(d, columnIDs);
  });

  return { scaleInfo, packages, nColumns: columnIDs.length };
}

interface UnitGroup {
  b_age: number;
  t_age: number;
  strat_name_id: number;
  strat_name_long: string;
  units: (UnitLong | null)[];
}

export interface UnitGroupBox extends UnitGroup {
  units: UnitLong[];
  startCol: number;
  endCol: number;
}

interface ColumnExt {
  columnID: number;
  units: UnitLong[];
}

interface MultiColumnPackageData {
  columnData: ColumnExt[];
  bestPixelScale?: number;
  b_age: number;
  t_age: number;
}

export function findLaterallyExtensiveUnits(
  pkg: MultiColumnPackageData,
): UnitGroup[] {
  const { columnData, b_age, t_age } = pkg;
  // Group units by strat_name_id
  const unitIndex = new Map<number, Map<number, UnitLong>>();
  for (const column of columnData) {
    const { units } = column;
    for (const unit of units) {
      if (unit.strat_name_id == null) continue;
      if (!unitIndex.has(unit.strat_name_id)) {
        unitIndex.set(unit.strat_name_id, new Map());
      }
      unitIndex.get(unit.strat_name_id).set(column.columnID, unit);
    }
  }

  // Prepare grouped units for rendering
  const unitGroups: UnitGroup[] = [];
  for (const [strat_name_id, unitIndex0] of unitIndex) {
    const units = columnData.map((d) => unitIndex0.get(d.columnID) ?? null);
    const filteredUnits = units.filter((d) => d != null);
    const [t_age, b_age] = mergeAgeRanges(
      filteredUnits.map((d) => [d.t_age, d.b_age]),
    );
    if (filteredUnits.length <= 1) continue;

    unitGroups.push({
      b_age,
      t_age,
      strat_name_id,
      strat_name_long: filteredUnits[0].strat_name_long,
      units,
    });
  }

  return unitGroups;
}

export function splitStratIntoBoxes(pkg: UnitGroup): UnitGroupBox[] {
  const { strat_name_long, strat_name_id, units } = pkg;
  const boxes: UnitGroupBox[] = [];
  let currentBox: UnitGroupBox = null;
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    if (unit == null) {
      if (currentBox != null) {
        boxes.push(currentBox);
        currentBox = null;
      }
      continue;
    }
    if (currentBox == null) {
      currentBox = {
        startCol: i,
        endCol: i,
        strat_name_id,
        strat_name_long,
        t_age: unit.t_age,
        b_age: unit.b_age,
        units: [],
      };
    } else {
      currentBox.endCol = i;
    }
    currentBox.units.push(unit);
  }
  return boxes;
}

function separateColumns(
  pkg: PackageLayoutData,
  columnIDs: number[],
): MultiColumnPackageData {
  /** Separate columns by col_id */
  const { units, t_age, b_age } = pkg;

  return {
    columnData: columnIDs.map((d) => {
      const u1 = units.filter((unit) => unit.col_id == d);
      u1.sort((a, b) => a.t_age - b.t_age);
      return {
        columnID: d,
        // Ensure that the units correctly show overlap
        units: preprocessUnits(
          {
            ...pkg,
            units: u1,
          },
          ColumnAxisType.AGE,
        ),
      };
    }),
    bestPixelScale: pkg.scaleInfo.pixelScale,
    t_age,
    b_age,
  };
}

export function columnGeoJSONRecordToColumnIdentifier(
  col: ColumnGeoJSONRecord,
): ColumnIdentifier {
  return {
    col_id: col.properties.col_id,
    col_name: col.properties.col_name,
    project_id: col.properties.project_id,
  };
}
