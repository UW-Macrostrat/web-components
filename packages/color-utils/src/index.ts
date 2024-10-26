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

interface ColorPair {
  color: string | null;
  backgroundColor: string | null;
}

export function getColorPair(color, inDarkMode): ColorPair {
  const chromaColor = asChromaColor(color);
  if (!chromaColor) {
    return { color: null, backgroundColor: null };
  }
  const nextChromaColor = inDarkMode
    ? chromaColor.brighten(2)
    : chromaColor.darken(2);
  const backgroundColor = inDarkMode
    ? chromaColor.darken(2)
    : chromaColor.brighten(2);
  return {
    color: nextChromaColor.css(),
    backgroundColor: backgroundColor.css(),
  };
}

export function toRGBAString(color: chroma.Color) {
  /** Format color as a comma-separated RGBA string. This is required
   * to get a CSS color in the legacy format (no longer supported by
   * chroma-js v3).
   */
  const colorStr = color
    .rgba()
    .map((c, i) => {
      const precision = i == 3 ? 2 : 0;
      return c.toFixed(precision);
    })
    .join(", ");
  return `rgba(${colorStr})`;
}
