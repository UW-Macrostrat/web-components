import chroma from "chroma-js";
import {
  Environment,
  Lithology,
  UnitLithology,
  UnitLong,
} from "@macrostrat/api-types";

interface KeyOptions {
  key?: "lith" | "environ";
  id_key?: "lith_id" | "environ_id";
}

export function getMixedUnitColor(
  unit: UnitLong,
  lithMap,
  inDarkMode = false,
  asBackground = true,
  keyOpts: KeyOptions = null,
): string | null {
  const { key = "lith", id_key: idKey } = keyOpts ?? {};
  const liths = unit[key];
  return getMixedColorForData(liths, lithMap, {
    inDarkMode,
    asBackground,
    key: idKey,
  });
}

interface ColorBuilderOptions {
  key?: "lith_id" | "environ_id";
  inDarkMode?: boolean;
  asBackground?: boolean;
}

export function flattenLithologies<
  T extends { prop: number | null; lith_id?: number; environ_id?: number },
>(liths: T[][], normalize: boolean = true): T[] {
  /** Unify proportions in lithology/environment data across several units, normalizing if needed.
   * If normalize is true, proportions are scaled to sum to 1 within each unit (with remaining proportions
   * distributed equally among liths without specified proportions). This helps ensure that units with a
   * few lithologies with specified proportions don't skew the color mixing.
   *
   * Lithologies are deduplicated based on their identifying property (lith_id or environ_id) if that is present.
   */
  if (liths == null || liths.length === 0) {
    return [];
  }

  const unitCount = liths.length;

  let newLiths: T[] = [];
  for (const unitLiths of liths) {
    let l1 = unitLiths;
    if (normalize) {
      l1 = addProportionsToAllData(unitLiths);
    }
    // Divide proportions by number of units to balance influence
    for (const lith of l1) {
      if (lith.prop == null || isNaN(lith.prop) || lith.prop <= 0) {
        continue;
      }
      lith.prop = lith.prop / unitCount;
    }
    newLiths.push(...l1);
  }
  if (newLiths[0]?.lith_id != null) {
    newLiths = mergeLikeData(newLiths, "lith_id");
  } else if (newLiths[0]?.environ_id != null) {
    newLiths = mergeLikeData(newLiths, "environ_id");
  }
  return newLiths;
}

export function getMixedColorForData(
  liths: UnitLithology[] | Lithology[] | Environment[] | null,
  lookupTable: Map<number, { color: string }> | null,
  options: ColorBuilderOptions = {},
): string | null {
  const { key = "lith_id", inDarkMode = false, asBackground = true } = options;
  if (liths == null || liths.length === 0) {
    return null;
  }
  const lithData = liths
    .map((d) => {
      let prop = d.prop;
      if (prop == null || isNaN(prop) || prop <= 0) {
        prop = null;
      }
      return {
        lith_id: d[key],
        prop,
        color: lookupTable?.get(d[key])?.color ?? d.color,
      };
    })
    .filter((d) => d.color != null);

  if (lithData.length == 0) {
    return null;
  }

  const lithsWithProp = addProportionsToAllData(lithData);

  // Mix colors proportionally
  const baseColor = chroma.average(
    lithsWithProp.map((d) => d.color),
    "lrgb",
    lithsWithProp.map((d) => d.prop),
  );

  if (!asBackground) {
    return baseColor.hex();
  }

  if (inDarkMode) {
    return baseColor.set("hsl.l", 0.2).hex();
  } else {
    return baseColor.set("hsl.l", 0.9).hex();
  }
}

function addProportionsToAllData<T extends { prop?: number }>(liths: T[]): T[] {
  /** Make sure that all lithologies/environments have a defined proportion,
   * and that proportions sum to 1. If some liths lack a defined proportion,
   * the remaining proportion is distributed equally among them.
   *
   * NOTE: This function does not normalize proportions if they already sum to more than 1.
   */
  const lithsWithProp = liths.filter((d) => d.prop != null);
  const lithsWithoutProp = liths.filter((d) => d.prop == null);

  const totalProp = lithsWithProp.reduce((sum, d) => sum + d.prop, 0);
  let overallTotal = 1;

  if (totalProp < overallTotal && lithsWithoutProp.length > 0) {
    const remainingProp = overallTotal - totalProp;
    // Distribute remaining proportion equally among liths without prop
    const equalProp = remainingProp / lithsWithoutProp.length;
    lithsWithoutProp.forEach((d) => {
      lithsWithProp.push({
        ...d,
        prop: equalProp,
      } as T);
    });
  }
  return lithsWithProp as T[];
}

function mergeLikeData<
  T extends { prop: number; lith_id?: number; environ_id?: number },
>(liths: T[], key: "lith_id" | "environ_id"): T[] {
  /** Merge lithology/environment data with the same identifying property (lith_id or environ_id),
   * summing their proportions.
   *
   * TODO: handle attribute merging
   */
  const mergedMap: Map<number, T> = new Map();

  for (const lith of liths) {
    const id = lith[key];
    if (id == null) continue;

    if (mergedMap.has(id)) {
      const existing = mergedMap.get(id);
      mergedMap.set(id, {
        ...existing,
        prop: existing.prop + lith.prop,
      });
    } else {
      mergedMap.set(id, { ...lith });
    }
  }

  return Array.from(mergedMap.values());
}
