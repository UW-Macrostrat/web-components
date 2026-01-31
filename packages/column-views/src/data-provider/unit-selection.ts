import { BaseUnit, UnitLong } from "@macrostrat/api-types";
import { useKeyHandler } from "@macrostrat/ui-components";
import { useEffect, useRef, useCallback, useMemo } from "react";
import type { RectBounds, IUnit } from "../units/types";
import { atom } from "jotai";
import { scope } from "./core";
import { columnUnitsMapAtom } from "./store";
import { ColumnData } from "@macrostrat/column-views";
import {
  AgeRangeQuantifiedDifference,
  ageRangeQuantifiedDifference,
  AgeRangeRelationship,
} from "@macrostrat/stratigraphy-utils";

type UnitSelectDispatch = (
  unit: number | BaseUnit | null,
  target: HTMLElement | null,
) => void;

export function useUnitSelectionDispatch(): UnitSelectDispatch {
  return scope.useSetAtom(selectedUnitAtom);
}

export function useSelectedUnit() {
  return scope.useAtomValue(selectedUnitAtom);
}

export interface ColumnClickData {
  unitID: number | null;
  unit: BaseUnit | null;
  target: HTMLElement | null;
  height: number;
  // Room for boundary IDs eventually
}

export interface UnitSelectionCallbacks {
  // It's sort of unfortunate that we need to pass in the column ref here
  onClickedColumn?: (columnClickData: ColumnClickData, event: Event) => void;
  onUnitSelected?: <T extends BaseUnit>(
    unitID: number | null,
    unit: T | null,
  ) => void;
}

export const allowUnitSelectionAtom = atom<boolean>(true);

export const selectedUnitIDAtom = atom<number | null>();

const overlayPositionAtom = atom<RectBounds | null>();

const columnRefAtom = atom<{ current: HTMLElement | null }>({ current: null });

export function useColumnRef() {
  return scope.useAtomValue(columnRefAtom);
}

const selectedUnitAtom = atom(
  (get) => {
    if (!get(allowUnitSelectionAtom)) return null;

    const unitID = get(selectedUnitIDAtom);
    if (unitID == null) return null;
    const unitsMap = get(columnUnitsMapAtom);
    return unitsMap?.get(unitID) || null;
  },
  (
    get,
    set,
    selectedUnit: number | BaseUnit | null,
    target: HTMLElement | null = null,
  ): BaseUnit | null => {
    if (!get(allowUnitSelectionAtom)) {
      throw new Error("Unit selection is disabled.");
    }

    let unitID: number | null;
    let unit: BaseUnit | null = null;
    if (selectedUnit == null) {
      unitID = null;
    } else if (typeof selectedUnit === "number") {
      unitID = selectedUnit;
    } else if ("unit_id" in selectedUnit) {
      unitID = selectedUnit.unit_id;
    }

    if (unitID != null) {
      // Verify that the unit exists in the current colum, else throw
      const unitsMap = get(columnUnitsMapAtom);
      if (!unitsMap?.has(unitID)) {
        throw new Error(
          `Unit with ID ${unitID} not found in current column units.`,
        );
      }
      unit = unitsMap.get(unitID) ?? null;
    }

    let overlayPosition: RectBounds | null = null;

    const columnEl = get(columnRefAtom)?.current;

    if (unit != null && columnEl != null && target != null) {
      const rect = columnEl.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      overlayPosition = {
        x: targetRect.left - rect.left,
        y: targetRect.top - rect.top,
        width: targetRect.width,
        height: targetRect.height,
      };
    }

    set(selectedUnitIDAtom, unitID);
    set(overlayPositionAtom, overlayPosition);

    return unit;
  },
);

export function useAtomOverlayPosition() {
  return scope.useAtomValue(overlayPositionAtom);
}

export function UnitSelectionCallbackManager({
  onUnitSelected,
}: UnitSelectionCallbacks) {
  const selectedUnit = scope.useAtomValue(selectedUnitAtom);
  useEffect(() => {
    onUnitSelected?.(selectedUnit?.unit_id ?? null, selectedUnit ?? null);
  }, [selectedUnit?.unit_id]);
  return null;
}

/** TODO: figure out if onClickedColumn is still needed
 /** This is not the natural place to get positions within the column,
 * but it will work for now.
if (props.onClickedColumn) {
  // Infer height from top and bottom height of unit (because that's passed back with the call)
  //const py = event.y;
  //const [bottom, top] = getUnitHeightRange(unit, axisType);
  //const height = Math.abs(bottom - top);

  const columnClickData: ColumnClickData = {
    unitID: unit?.unit_id,
    unit,
    target,
    height: el?.getBoundingClientRect().height || 0,
  };
  props.onClickedColumn(columnClickData, event);
}*/

export function useUnitSelectionTarget(
  unit: IUnit,
): [React.RefObject<HTMLElement>, boolean, (evt: Event) => void] {
  const ref = useRef<HTMLElement>();
  const selectedUnit = useSelectedUnit();
  const selectUnit = useUnitSelectionDispatch();
  const selected = selectedUnit?.unit_id == unit.unit_id;

  const onClick = useCallback(
    (evt: Event) => {
      selectUnit?.(unit, ref.current);
      evt.stopPropagation();
    },
    [unit, selectUnit],
  );

  useEffect(() => {
    if (!selected || selectUnit == null) return;
    // In case we haven't set the position of the unit (if we don't have a target), set the selected unit
    selectUnit(unit, ref.current);

    // Scroll the unit into view
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [selected, selectUnit]);

  return [ref, selected, onClick];
}

export function UnitKeyboardNavigation({
  columnData,
  units,
  allowHorizontalNavigation,
}: {
  columnData?: ColumnData[];
  units?: UnitLong[];
  allowHorizontalNavigation?: boolean;
}) {
  if (units == null && columnData == null) {
    throw new Error("Either units or columnData must be provided.");
  }

  let _columnData: ColumnData[] = useMemo(() => {
    if (columnData != null) return columnData;
    // Build column data from units
    const colMap = new Map<number, UnitLong[]>();
    for (const unit of units!) {
      if (!colMap.has(unit.col_id)) {
        colMap.set(unit.col_id, []);
      }
      colMap.get(unit.col_id)!.push(unit);
    }
    const cols: ColumnData[] = [];
    for (const [colID, units] of colMap) {
      cols.push({ columnID: colID, units });
    }
    // Sort columns by columnID
    cols.sort((a, b) => a.columnID - b.columnID);
    return cols;
  }, [columnData, units]);

  // Default to allowing horizontal navigation only if columnData is provided
  const _allowHorizontalNavigation =
    allowHorizontalNavigation ?? columnData != null;

  const selectedUnit = useSelectedUnit() as UnitLong | null;
  const selectUnit = useUnitSelectionDispatch();

  const keyMap: Record<number, Direction> = {
    38: "up",
    40: "down",
  };
  if (_allowHorizontalNavigation) {
    keyMap[37] = "left";
    keyMap[39] = "right";
  }

  useKeyHandler(
    (event) => {
      const direction = keyMap[event.keyCode];
      if (direction == null) return;
      const nextUnit = getBestUnit(_columnData, selectedUnit, direction);
      if (nextUnit == null) return;
      selectUnit(nextUnit, null);
      event.stopPropagation();
    },
    [_columnData, selectedUnit],
  );
  return null;
}

type Direction = "up" | "down" | "left" | "right";

function getBestUnit(
  columnData: ColumnData[],
  targetUnit: UnitLong,
  direction: Direction,
): UnitLong | null {
  const thisColIndex = columnData.findIndex(
    (col) => col.columnID === targetUnit.col_id,
  );
  if (thisColIndex === -1) return null;

  // If up or down, stay in the same column
  if (direction === "up" || direction === "down") {
    const units = columnData[thisColIndex].units;
    const ix = units.findIndex((unit) => unit.unit_id === targetUnit.unit_id);
    if (ix === -1) return null;
    if (direction === "up") {
      return units[ix - 1] || null;
    } else {
      return units[ix + 1] || null;
    }
  }

  // If left or right, move to adjacent column
  let adjacentColIndex: number;
  if (direction === "left") {
    adjacentColIndex =
      (thisColIndex - 1 + columnData.length) % columnData.length;
  } else {
    adjacentColIndex = (thisColIndex + 1) % columnData.length;
  }

  const adjacentColUnits = columnData[adjacentColIndex].units;
  return getMostOverlappingUnit(targetUnit, adjacentColUnits);
}

type UnitAgeRangeRelationship = AgeRangeQuantifiedDifference & {
  unit: UnitLong;
};

function getMostOverlappingUnit(
  targetUnit: UnitLong,
  candidateUnits: UnitLong[],
): UnitLong | null {
  const targetAgeRange = [targetUnit.b_age, targetUnit.t_age];

  const overlaps: UnitAgeRangeRelationship[] = [];
  for (const candidate of candidateUnits) {
    const candidateAgeRange = [candidate.b_age, candidate.t_age];

    const rel = ageRangeQuantifiedDifference(targetAgeRange, candidateAgeRange);
    if (rel.type === AgeRangeRelationship.Identical) {
      return candidate;
    }
    overlaps.push({ ...rel, unit: candidate });
  }

  let bestOverlaps = overlaps.filter(
    (d) => d.type === AgeRangeRelationship.Containing,
  );
  bestOverlaps.sort((a, b) => b.overlap - a.overlap);
  if (bestOverlaps.length > 0) {
    return bestOverlaps[0].unit;
  }

  bestOverlaps = overlaps.filter(
    (d) => d.type === AgeRangeRelationship.Contained,
  );
  bestOverlaps.sort((a, b) => b.overlap - a.overlap);
  if (bestOverlaps.length > 0) {
    return bestOverlaps[0].unit;
  }

  bestOverlaps = overlaps.filter(
    (d) => d.type === AgeRangeRelationship.PartialOverlap,
  );
  bestOverlaps.sort((a, b) => b.overlap - a.overlap);
  if (bestOverlaps.length > 0) {
    return bestOverlaps[0].unit;
  }

  bestOverlaps = overlaps.filter(
    (d) => d.type === AgeRangeRelationship.Disjoint,
  );
  bestOverlaps.sort((a, b) => a.distance - b.distance);
  if (bestOverlaps.length > 0) {
    return bestOverlaps[0].unit;
  }
  return null;
}
