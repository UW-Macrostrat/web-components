import { BaseUnit, UnitLong } from "@macrostrat/api-types";
import { useKeyHandler } from "@macrostrat/ui-components";
import { useEffect, useRef, useCallback } from "react";
import type { RectBounds, IUnit } from "../units/types";
import { atom } from "jotai";
import { columnUnitsMapAtom, scope } from "./core";
import { ColumnData } from "@macrostrat/column-views";
import {
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

export function UnitKeyboardNavigation<T extends BaseUnit>({
  units,
}: {
  units: T[];
}) {
  const selectedUnit = useSelectedUnit();
  const selectUnit = useUnitSelectionDispatch();

  const ix = units.findIndex((unit) => unit.unit_id === selectedUnit?.unit_id);

  const keyMap = {
    38: ix - 1,
    40: ix + 1,
  };

  useKeyHandler(
    (event) => {
      const nextIx = keyMap[event.keyCode];
      if (nextIx == null || nextIx < 0 || nextIx >= units.length) return;
      selectUnit(units[nextIx], null);
      event.stopPropagation();
    },
    [units, ix],
  );
  return null;
}

export function CorrelationChartKeyboardNavigation({
  columnData,
}: {
  columnData: ColumnData[];
}) {
  const selectedUnit = useSelectedUnit() as UnitLong | null;
  const selectUnit = useUnitSelectionDispatch();

  let colIndex: number | null = null;
  let units: UnitLong[] = [];

  let bestNextUnit: UnitLong | null = null;
  let bestPrevUnit: UnitLong | null = null;
  if (selectedUnit) {
    colIndex = columnData.findIndex((col) => {
      return col.columnID === selectedUnit.col_id;
    });
    units = columnData[colIndex].units;

    const nextColIndex =
      colIndex != null ? (colIndex + 1) % columnData.length : null;
    const prevColIndex =
      colIndex != null
        ? (colIndex - 1 + columnData.length) % columnData.length
        : null;

    // Find best overlapping unit in next column, if existing
    if (columnData[nextColIndex] != null) {
      const nextColUnits = columnData[nextColIndex].units;
      bestNextUnit = getMostOverlappingUnit(selectedUnit, nextColUnits);
    }
    // Find best overlapping unit in previous column, if existing
    if (columnData[prevColIndex] != null) {
      const prevColUnits = columnData[prevColIndex].units;
      bestPrevUnit = getMostOverlappingUnit(selectedUnit, prevColUnits);
    }
  }

  const ix = units.findIndex((unit) => unit.unit_id === selectedUnit?.unit_id);

  let bestUpUnit: UnitLong | null = null;
  let bestDownUnit: UnitLong | null = null;

  bestUpUnit = units[ix - 1] || null;
  bestDownUnit = units[ix + 1] || null;

  const unitsMap = {
    37: bestPrevUnit?.unit_id, // Left arrow
    39: bestNextUnit?.unit_id, // Right arrow
    38: bestUpUnit?.unit_id, // Up arrow
    40: bestDownUnit?.unit_id, // Down arrow
  };

  useKeyHandler(
    (event) => {
      const nextUnitID = unitsMap[event.keyCode];
      if (nextUnitID == null) return;
      selectUnit(nextUnitID, null);
      event.stopPropagation();
    },
    [units, ix],
  );
  return null;
}

type UnitAgeRangeRelationship = AgeRangeRelationship & {
  unit: UnitLong;
  score: number;
};

function getMostOverlappingUnit(
  targetUnit: UnitLong,
  candidateUnits: UnitLong[],
): UnitLong | null {
  const targetAgeRange = [targetUnit.t_age, targetUnit.b_age];

  const overlaps: UnitAgeRangeRelationship[] = [];
  for (const candidate of candidateUnits) {
    const candidateAgeRange = [candidate.t_age, candidate.b_age];

    const rel = ageRangeQuantifiedDifference(targetAgeRange, candidateAgeRange);
    let score = 0;
    if (rel.type === AgeRangeRelationship.Identical) {
      score = -Infinity;
    } else if (rel.type === AgeRangeRelationship.Disjoint) {
      score = rel.distance;
    } else {
      score = -rel.overlap;
    }
    overlaps.push({ unit: candidate, score, type: rel.type });
  }
  overlaps.sort((a, b) => a.score - b.score);
  if (overlaps.length === 0) return null;
  return overlaps[0].unit;
}
