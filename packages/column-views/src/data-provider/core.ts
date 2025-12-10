import type { ExtUnit } from "../prepare-units";
import { atom } from "jotai";

export const columnUnitsAtom = atom<ExtUnit[]>();

export const columnUnitsMapAtom = atom<Map<number, ExtUnit> | null>((get) => {
  const units = get(columnUnitsAtom);
  if (!units) return null;
  const unitMap = new Map<number, ExtUnit>();
  units.forEach((unit) => {
    unitMap.set(unit.unit_id, unit);
  });
  return unitMap;
});
