import chroma from "chroma-js";

export function asChromaColor(color): chroma.Color | null {
  // Check if is a chroma color already
  if (color instanceof chroma.Color) {
    return color;
  }
  try {
    return chroma(color);
  } catch (e) {
    return null;
  }
}
