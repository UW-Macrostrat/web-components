import chroma, { Color } from "chroma-js";

export function asChromaColor(
  color: chroma.ChromaInput | Color | null
): Color | null {
  // Check if is a chroma color already
  // @ts-ignore
  if (color instanceof chroma.Color) {
    return color as Color;
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

export function getColorPair(
  color: chroma.ChromaInput,
  inDarkMode: boolean = false
): ColorPair {
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

export function toRGBAString(color: Color): string {
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

interface ColorScheme {
  textColor: string;
  backgroundColor: string;
  secondaryColor: string;
  secondaryBackgroundColor: string;
}

export function getLuminanceAdjustedColorScheme(
  color: chroma.ChromaInput,
  darkMode: boolean = false
): ColorScheme | null {
  /** Luminance-adjusted color scheme for tags, etc. with dark mode support */
  if (!color) {
    return null;
  }
  const _color = asChromaColor(color);
  const luminance = darkMode ? 0.9 : 0.2;
  const backgroundLuminance = darkMode ? 0.1 : 0.8;
  const mainColor = _color?.luminance(luminance).css();
  const backgroundColor = _color?.luminance(backgroundLuminance).css();

  const secondaryBackgroundColor = _color
    ?.luminance(darkMode ? 0.04 : 0.9)
    .css();

  const secondaryColor = _color?.luminance(0.5).css();

  return {
    textColor: mainColor,
    backgroundColor,
    secondaryColor,
    secondaryBackgroundColor,
  };
}

export function asCSSVariables(
  anyScheme: Record<string, string>,
  prefix: string = ""
): { [key: string]: string } {
  if (!anyScheme) {
    return {};
  }
  let _prefix = "";
  if (prefix.length > 0 && !prefix.endsWith("-")) {
    _prefix = `${prefix}-`;
  }
  _prefix = `--${_prefix}`;
  /** Convert camelCase to kebab-case and add a prefix */
  return Object.entries(anyScheme).reduce((acc, [key, value]) => {
    acc[`${_prefix}${convertToKebabCase(key)}`] = value;
    return acc;
  }, {});
}

const convertToKebabCase = (str) =>
  str.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($, ofs) => (ofs ? "-" : "") + $.toLowerCase()
  );
