import { atom } from "jotai";
import { BaseUnit } from "@macrostrat/api-types";

export const columnUnitsAtom = atom<BaseUnit[]>();

export const columnUnitsMapAtom = atom<Map<number, BaseUnit> | null>((get) => {
  const units = get(columnUnitsAtom);
  if (!units) return null;
  const unitMap = new Map<number, BaseUnit>();
  units.forEach((unit) => {
    unitMap.set(unit.unit_id, unit);
  });
  return unitMap;
});
