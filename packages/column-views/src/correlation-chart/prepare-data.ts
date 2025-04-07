import { AgeComparable, GapBoundPackage, SectionRenderData } from "./types";
import { CompositeStratigraphicScaleInfo } from "../age-axis";
import {
  buildCompositeScaleInfo,
  LinearScaleDef,
  SectionInfo,
} from "../prepare-units/composite-scale";
import { ColumnAxisType } from "@macrostrat/column-components";
import { UnitLong } from "@macrostrat/api-types";
import { PrepareColumnOptions, prepareColumnUnits } from "../prepare-units";
import { mergeAgeRanges } from "@macrostrat/stratigraphy-utils";
import { CorrelationChartData } from "./types";

export function deriveScale(
  packages: SectionRenderData[],
  unconformityHeight: number = 24
): CompositeStratigraphicScaleInfo {
  /** Find the total height and scale for each package */
  const scales: LinearScaleDef[] = packages.map((d) => {
    return {
      domain: [d.b_age, d.t_age],
      pixelScale: d.bestPixelScale,
    };
  });

  const { sections, totalHeight } = buildCompositeScaleInfo(
    scales,
    unconformityHeight
  );

  return {
    packages: sections,
    totalHeight,
    axisType: ColumnAxisType.AGE,
  };
}

export enum AgeScaleMode {
  Continuous = "continuous",
  Broken = "broken",
}

interface ColumnData {
  columnID: number;
  units: UnitLong[];
}

interface CorrelationChartSettings {
  ageMode?: AgeScaleMode;
  targetUnitHeight?: number;
}

export function buildColumnData(
  columns: ColumnData[],
  settings: CorrelationChartSettings | undefined
): CorrelationChartData {
  const { ageMode = AgeScaleMode.Continuous, targetUnitHeight = 10 } =
    settings ?? {};

  const opts: PrepareColumnOptions = {
    axisType: ColumnAxisType.AGE,
    targetUnitHeight,
    unconformityHeight: 20,
  };

  // Preprocess column data
  const columns1 = columns.map((d) => {
    const { columnID, units } = d;
    return {
      columnID,
      ...prepareColumnUnits(units, opts),
    };
  });

  // Create a single gap-bound package for each column
  const units = columns1.map((d) => d.units);
  const [b_age, t_age] = findEncompassingScaleBounds(units.flat());

  if (ageMode == AgeScaleMode.Continuous) {
    const dAge = b_age - t_age;
    const maxNUnits = Math.max(...units.map((d) => d.length));
    const targetHeight = targetUnitHeight * maxNUnits;
    const pixelScale = Math.ceil(targetHeight / dAge);

    const columnData: SectionRenderData[][] = columns1.map((d) => {
      return [
        {
          b_age,
          t_age,
          bestPixelScale: pixelScale,
          ...d,
        },
      ];
    });

    return { columnData, b_age, t_age };
  }

  let pkgs: GapBoundPackage[] = [];
  for (const column of columns1) {
    pkgs.push(...findGapBoundPackages(column));
  }
  pkgs = mergeOverlappingGapBoundPackages(pkgs);
  pkgs.sort((a, b) => a.b_age - b.b_age);

  // Get the best pixel scale for each gap-bound package
  const pixelScales = pkgs.map((pkg) =>
    findBestPixelScale(pkg, { targetUnitHeight })
  );

  const columnData = columns1.map((d) => {
    return pkgs
      .map((pkg, i): SectionRenderData => {
        const { t_age, b_age } = pkg;
        let units = pkg.unitIndex.get(d.columnID) ?? [];

        units.sort((a, b) => a.b_age - b.b_age);

        return {
          t_age,
          b_age,
          columnID: d.columnID,
          bestPixelScale: pixelScales[i],
          units,
        };
      })
      .sort((a, b) => a.b_age - b.b_age);
  });

  return { columnData, b_age, t_age };
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
  bestPixelScale: number;
  b_age: number;
  t_age: number;
}

export function findLaterallyExtensiveUnits(
  pkg: MultiColumnPackageData
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
      filteredUnits.map((d) => [d.t_age, d.b_age])
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

interface PixelScaleOptions {
  targetUnitHeight: number;
}

function findBestPixelScale(
  pkg: SectionInfo,
  options: PixelScaleOptions
): number {
  const { targetUnitHeight } = options;
  const dAge = pkg.b_age - pkg.t_age;
  const maxNUnits = Math.max(
    ...Array.from(pkg.unitIndex.values()).map((d) => d.length)
  );
  let targetHeight = targetUnitHeight * maxNUnits;

  targetHeight = Math.max(targetHeight, 25, dAge / 25);

  return targetHeight / dAge;
}

function mergeOverlappingGapBoundPackages(
  packages: GapBoundPackage[]
): GapBoundPackage[] {
  // Sort by t_age
  let remainingPackages: GapBoundPackage[] = packages;
  let newPackages: GapBoundPackage[] = [];
  while (remainingPackages.length > 0) {
    const pkg = remainingPackages.pop();
    const overlapping = findOverlapping(pkg, remainingPackages);
    newPackages.push(mergePackages(pkg, ...overlapping));
    remainingPackages = remainingPackages.filter(
      (d) => !overlapping.includes(d)
    );
  }
  if (newPackages.length < packages.length) {
    return mergeOverlappingGapBoundPackages(newPackages);
  } else {
    return newPackages;
  }
  // Chunk by divisions where t_age is less than the next b_age
}

function findEncompassingScaleBounds(units: AgeComparable[]) {
  const b_age = Math.max(...units.map((d) => d.b_age));
  const t_age = Math.min(...units.map((d) => d.t_age));
  return [b_age, t_age];
}

function mergePackages(...packages: GapBoundPackage[]): GapBoundPackage {
  return packages.reduce(
    (a: GapBoundPackage, b: GapBoundPackage) => {
      a.b_age = Math.max(a.b_age, b.b_age);
      a.t_age = Math.min(a.t_age, b.t_age);
      for (let [columnID, units] of b.unitIndex) {
        if (a.unitIndex.has(columnID)) {
          a.unitIndex.set(columnID, a.unitIndex.get(columnID).concat(units));
        } else {
          a.unitIndex.set(columnID, units);
        }
      }
      return a;
    },
    {
      b_age: -Infinity,
      t_age: Infinity,
      unitIndex: new Map(),
    }
  );
}

function findGapBoundPackages(columnData: ColumnData): GapBoundPackage[] {
  /** Find chunks of units overlapping in time, separated by unconformities */
  const { units, columnID } = columnData;
  let packages: GapBoundPackage[] = [];
  for (let unit of columnData.units) {
    const newPackage: GapBoundPackage = {
      b_age: unit.b_age,
      t_age: unit.t_age,
      unitIndex: new Map([[columnID, [unit]]]),
    };

    const overlappingPackages: GapBoundPackage[] = findOverlapping(
      newPackage,
      packages
    );

    // If the unit overlaps with some packages, remove them.
    packages = packages.filter((d) => !overlappingPackages.includes(d));

    // Merge the overlapping packages with the new package
    if (overlappingPackages.length > 0) {
      packages.push(mergePackages(newPackage, ...overlappingPackages));
    } else {
      packages.push(newPackage);
    }
  }
  return packages;
}

function findOverlapping<T extends AgeComparable>(
  a: AgeComparable,
  collection: T[]
): T[] {
  return collection.filter((d) => ageOverlaps(a, d));
}

function ageOverlaps(a: AgeComparable, b: AgeComparable) {
  return a.t_age <= b.b_age && a.b_age >= b.t_age;
}

// Regrid chart data to go by package
export function regridChartData(data: CorrelationChartData) {
  const { columnData } = data;
  let packages: MultiColumnPackageData[] = columnData[0].map((d, i) => {
    return {
      b_age: d.b_age,
      t_age: d.t_age,
      bestPixelScale: d.bestPixelScale,
      columnData: [] as ColumnExt[],
    };
  });
  for (let column of columnData) {
    for (let i = 0; i < column.length; i++) {
      packages[i].columnData.push({
        columnID: column[i].columnID,
        units: column[i].units,
      });
    }
  }

  return packages;
}
