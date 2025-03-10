import chroma from "chroma-js";

export function getMixedUnitColor(unit, lithMap) {
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

  return chroma
    .average(
      lithsWithProp.map((d) => d.color),
      "lrgb",
      lithsWithProp.map((d) => d.prop)
    )
    .luminance(0.4)
    .hex();
}
