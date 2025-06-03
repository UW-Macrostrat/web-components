import chroma from "chroma-js";
import { UnitLong } from "@macrostrat/api-types";

interface KeyOptions {
  key?: string;
  id_key?: string;
}

export function getMixedUnitColor(
  unit: UnitLong,
  lithMap,
  inDarkMode = false,
  asBackground = true,
  keyOpts: KeyOptions = null
): string | null {
  const { key = "lith", id_key = "lith_id" } = keyOpts ?? {};
  const liths = unit[key];
  if (liths == null) {
    return "gray";
  }
  const lithData = liths
    .map((d) => {
      let prop = d.prop;
      if (prop == null || isNaN(prop) || prop <= 0) {
        prop = null;
      }
      return {
        lith_id: d[id_key],
        prop,
        color: lithMap?.get(d[id_key])?.color,
      };
    })
    .filter((d) => d.color != null);

  const lithsWithProp = lithData.filter((d) => d.prop != null);
  const lithsWithoutProp = lithData.filter((d) => d.prop == null);

  const totalProp = lithsWithProp.reduce((sum, d) => sum + d.prop, 0);
  if (totalProp < 1 && lithsWithoutProp.length > 0) {
    const remainingProp = 1 - totalProp;
    // Distribute remaining proportion equally among liths without prop
    const equalProp = remainingProp / lithsWithoutProp.length;
    lithsWithoutProp.forEach((d) => {
      lithsWithProp.push({
        ...d,
        prop: equalProp,
      });
    });
  }

  if (lithsWithProp.length == 0) {
    return null;
  }

  // Mix colors proportionally
  const baseColor = chroma.average(
    lithsWithProp.map((d) => d.color),
    "lrgb",
    lithsWithProp.map((d) => d.prop)
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
