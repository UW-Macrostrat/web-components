import type { BaseUnit, UnitLong } from "@macrostrat/api-types";
import { useKeyHandler } from "@macrostrat/ui-components";
import { useEffect, useRef, useCallback, useMemo } from "react";
import type { RectBounds, IUnit } from "../units/types";
import { atom } from "jotai";
import { scope, columnUnitsAtom, columnUnitsMapAtom } from "./store";
import {
  AgeRangeQuantifiedDifference,
  ageRangeQuantifiedDifference,
  AgeRangeRelationship,
} from "@macrostrat/stratigraphy-utils";
import type { ColumnData } from "@macrostrat/data-provider";

/** How a selection request combines with the current selection.
 * - `replace` (default): select only this unit
 * - `toggle`: add the unit to the selection, or remove it if already selected
 * - `range`: select every unit between the anchor (the last unit selected
 *   on its own or toggled on) and this one, in the same column
 * `toggle` and `range` act like `replace` unless multiple selection is on. */
export type UnitSelectionMode = "replace" | "toggle" | "range";

type UnitSelectDispatch = (
  unit: number | BaseUnit | null,
  target: HTMLElement | null,
  mode?: UnitSelectionMode,
) => void;

export function useUnitSelection() {
  return scope.use(selectedUnitAtom);
}

export function useUnitSelectionDispatch(): UnitSelectDispatch {
  return scope.useSetAtom(selectedUnitAtom);
}

export function useSelectedUnit() {
  return scope.useAtomValue(selectedUnitAtom);
}

/** Every selected unit, in selection order. The last is the "primary"
 * selection that `useSelectedUnit` returns (the one the popover and keyboard
 * navigation follow). */
export function useSelectedUnits(): BaseUnit[] {
  return scope.useAtomValue(selectedUnitsAtom);
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
  /** Called with every selected unit when the selection changes (with
   * `allowMultipleSelection`). */
  onUnitsSelected?: <T extends BaseUnit>(unitIDs: number[], units: T[]) => void;
}

export const allowUnitSelectionAtom = atom<boolean>(true);

export const allowMultipleSelectionAtom = atom<boolean>(false);

/** The primary selected unit */
export const selectedUnitIDAtom = atom<number | null>();
/** Every selected unit, with the primary last. Unused (null) for single
 * selection, where the primary unit is the whole selection. */
export const selectedUnitIDsAtom = atom<number[] | null>();
export const selectedUnitElementAtom = atom<HTMLElement | null>();
/** Where a `range` selection starts from */
const selectionAnchorIDAtom = atom<number | null>();

/** The primary selected unit. Under multiple selection, it must be one of
 * the selected units: if a controlled selection leaves it out, the last of
 * them takes its place. */
const primaryUnitIDAtom = atom<number | null>((get) => {
  if (!get(allowUnitSelectionAtom)) return null;
  const primary = get(selectedUnitIDAtom) ?? null;
  const ids = get(selectedUnitIDsAtom);
  if (!get(allowMultipleSelectionAtom) || ids == null) return primary;
  if (ids.includes(primary)) return primary;
  return ids[ids.length - 1] ?? null;
});

/** The IDs of every selected unit, primary last */
export const selectedUnitIDListAtom = atom<number[]>((get) => {
  const primary = get(primaryUnitIDAtom);
  let list: number[] = [];
  if (get(allowMultipleSelectionAtom)) {
    list = (get(selectedUnitIDsAtom) ?? []).filter((id) => id != primary);
  }
  if (primary != null) list.push(primary);
  return list;
});

const selectedUnitIDSetAtom = atom(
  (get) => new Set<number>(get(selectedUnitIDListAtom)),
);

const selectedUnitsAtom = atom<BaseUnit[]>((get) => {
  const unitsMap = get(columnUnitsMapAtom);
  return get(selectedUnitIDListAtom)
    .map((id) => unitsMap?.get(id))
    .filter((d) => d != null);
});

const overlayPositionAtom = atom<RectBounds | null>();

const columnRefAtom = atom<{ current: HTMLElement | null }>({ current: null });

export function useColumnRef() {
  return scope.useAtomValue(columnRefAtom);
}

const selectedUnitAtom = atom(
  (get) => {
    const unitID = get(primaryUnitIDAtom);
    if (unitID == null) return null;
    const unitsMap = get(columnUnitsMapAtom);
    return unitsMap?.get(unitID) || null;
  },
  (
    get,
    set,
    selectedUnit: number | BaseUnit | null,
    target: HTMLElement | null = null,
    mode: UnitSelectionMode = "replace",
  ): BaseUnit | null => {
    if (!get(allowUnitSelectionAtom)) {
      console.error("Unit selection is disabled.");
      return null;
    }

    const unitID = getUnitID(selectedUnit);
    const unitsMap = get(columnUnitsMapAtom);
    // Verify that the unit exists in the current column, else throw
    if (unitID != null && !unitsMap?.has(unitID)) {
      throw new Error(
        `Unit with ID ${unitID} not found in current column units.`,
      );
    }

    let _mode = mode;
    if (!get(allowMultipleSelectionAtom) || unitID == null) {
      _mode = "replace";
    }

    let ids: number[] = [];
    let primary = unitID;
    const current = get(selectedUnitIDListAtom);

    if (_mode == "replace") {
      if (primary != null) ids = [primary];
      set(selectionAnchorIDAtom, primary);
    } else if (_mode == "toggle") {
      if (current.includes(unitID)) {
        // Deselect, handing the primary selection to the last one left
        ids = current.filter((id) => id != unitID);
        primary = ids[ids.length - 1] ?? null;
        target = null;
      } else {
        ids = [...current, unitID];
        set(selectionAnchorIDAtom, unitID);
      }
    } else if (_mode == "range") {
      const anchor = get(selectionAnchorIDAtom) ?? current[current.length - 1];
      ids = unitsBetween(get(columnUnitsAtom), anchor, unitID);
      // Keep the clicked unit as the primary selection
      ids = [...ids.filter((id) => id != unitID), unitID];
    }

    const unit = unitsMap?.get(primary) ?? null;
    set(selectedUnitIDsAtom, ids);
    setPrimaryUnit(get, set, unit, target);

    return unit;
  },
);

/** Point the primary selection at a unit and its element, which places the
 * popover. */
function setPrimaryUnit(get, set, unit: BaseUnit | null, target: HTMLElement) {
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

  set(selectedUnitElementAtom, target);
  set(selectedUnitIDAtom, unit?.unit_id ?? null);
  set(overlayPositionAtom, overlayPosition);
}

/** Attach the primary unit's element once it renders, without changing the
 * selection */
const syncSelectedElementAtom = atom(
  null,
  (get, set, unitID: number, target: HTMLElement | null) => {
    if (get(primaryUnitIDAtom) != unitID) return;
    const unit = get(columnUnitsMapAtom)?.get(unitID) ?? null;
    setPrimaryUnit(get, set, unit, target);
  },
);

export function useAtomOverlayPosition() {
  return scope.useAtomValue(overlayPositionAtom);
}

export function UnitSelectionCallbackManager({
  onUnitSelected,
  onUnitsSelected,
}: UnitSelectionCallbacks) {
  const selectedUnit = scope.useAtomValue(selectedUnitAtom);
  useEffect(() => {
    onUnitSelected?.(selectedUnit?.unit_id ?? null, selectedUnit ?? null);
  }, [selectedUnit?.unit_id]);

  const selectedUnits = scope.useAtomValue(selectedUnitsAtom);
  const key = selectedUnits.map((d) => d.unit_id).join(",");
  useEffect(() => {
    onUnitsSelected?.(
      selectedUnits.map((d) => d.unit_id),
      selectedUnits as any[],
    );
  }, [key]);
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
): [React.RefObject<HTMLElement>, boolean, (evt: MouseEvent) => void, boolean] {
  const ref = useRef<HTMLElement>(null);
  const [selectedUnit, selectUnit] = useUnitSelection();
  const syncElement = scope.useSetAtom(syncSelectedElementAtom);
  const allowMultiple = scope.useAtomValue(allowMultipleSelectionAtom);
  const isPrimary = selectedUnit?.unit_id == unit.unit_id;
  const selected = scope.useAtomValue(selectedUnitIDSetAtom).has(unit.unit_id);
  const selectedUnitElement = scope.useAtomValue(selectedUnitElementAtom);

  // "Linked" units share a stratigraphic name with the selected unit (e.g.
  // the same formation correlated across columns), but are not the selection
  // itself. They receive a subtler highlight.
  const selectedStratName = (selectedUnit as any)?.strat_name_id;
  const unitStratName = (unit as any)?.strat_name_id;
  const linked =
    !selected &&
    selectedStratName != null &&
    unitStratName != null &&
    unitStratName === selectedStratName;

  const onClick = useCallback(
    (evt: MouseEvent) => {
      let mode: UnitSelectionMode = "replace";
      if (allowMultiple && evt.shiftKey) {
        mode = "range";
      } else if (allowMultiple && (evt.metaKey || evt.ctrlKey)) {
        mode = "toggle";
      }
      selectUnit?.(unit, ref.current, mode);
      evt.stopPropagation();
    },
    [unit, selectUnit, allowMultiple],
  );

  useEffect(() => {
    // Sync the primary selection with this unit's element...
    if (!isPrimary) return;
    syncElement(unit.unit_id, ref.current);
  }, [ref.current, isPrimary, syncElement]);

  useEffect(() => {
    // Scroll the unit into view
    selectedUnitElement?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [selectedUnitElement]);

  return [ref, selected, onClick, linked];
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

function getUnitID(unit: number | BaseUnit | null): number | null {
  if (unit == null) return null;
  if (typeof unit === "number") return unit;
  if ("unit_id" in unit) return unit.unit_id;
  return null;
}

/** IDs of the units from one to another (inclusive), in column order. Units
 * in other columns (e.g., of a correlation chart) are left out. */
function unitsBetween(
  units: BaseUnit[] | undefined,
  fromID: number | null,
  toID: number,
): number[] {
  const all = units ?? [];
  const to = all.find((d) => d.unit_id == toID);
  const from = all.find((d) => d.unit_id == fromID);
  if (from == null || to == null) return [toID];
  const colID = (to as any).col_id;
  const column = all.filter((d) => (d as any).col_id == colID);
  const i0 = column.indexOf(from);
  const i1 = column.indexOf(to);
  if (i0 == -1) return [toID];
  return column
    .slice(Math.min(i0, i1), Math.max(i0, i1) + 1)
    .map((d) => d.unit_id);
}
