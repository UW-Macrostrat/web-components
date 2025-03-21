import chroma from "chroma-js";
import { UnitLong } from "@macrostrat/api-types";

export function getMixedUnitColor(unit: UnitLong, lithMap, inDarkMode = false) {
  const liths = unit.lith;
  if (liths == null) {
    return "gray";
  }
  const lithData = liths.map((d) => {
    return {
      lith_id: d.lith_id,
      prop: d.prop,
      color: lithMap?.get(d.lith_id)?.color ?? "gray",
    };
  });

  const lithsWithProp = lithData.filter((d) => d.prop != null);

  // Mix colors proportionally
  const baseColor = chroma.average(
    lithsWithProp.map((d) => d.color),
    "lrgb",
    lithsWithProp.map((d) => d.prop)
  );

  if (inDarkMode) {
    return baseColor.set("hsl.l", 0.2).hex();
  } else {
    return baseColor.set("hsl.s", 0.7).set("hsl.l", 0.9).hex();
  }
}
