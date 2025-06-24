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
  mainColor: string;
  backgroundColor: string;
  secondaryColor: string;
  secondaryBackgroundColor: string;
}

export function getLuminanceAdjustedColorScheme(
  color: chroma.ChromaInput,
  darkMode: boolean = false,
  delta: number = 0.1
): ColorScheme | null {
  /** Luminance-adjusted color scheme for tags, etc. with dark mode support */
  if (!color) {
    return null;
  }
  const _color = asChromaColor(color);
  const luminance = darkMode ? 1 - delta : 2 * delta;
  const backgroundLuminance = darkMode ? delta : 1 - 2 * delta;
  const mainColor = _color?.luminance(luminance).css();
  let bkg = _color?.luminance(backgroundLuminance);

  const backgroundColor = bkg.css();

  const secondaryBackgroundColor = _color
    ?.luminance(darkMode ? delta / 2 : 1 - delta)
    .css();

  const secondaryColor = _color?.luminance(0.5).css();

  return {
    mainColor,
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

export function getCSSVariable(variableName: string, fallbackValue: string) {
  // If we're not in a browser environment, return the fallback value
  if (typeof window === "undefined" || typeof document === "undefined") {
    return fallbackValue;
  }
  const value = getComputedStyle(document.body).getPropertyValue(variableName);
  return value.trim() || fallbackValue;
}
