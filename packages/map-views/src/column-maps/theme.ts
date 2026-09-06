/** Colors for the column maps, settable with CSS custom properties.
 *
 * Mapbox layers can't read `var(--…)` themselves, so the map resolves the
 * variables once from its container element when it mounts (`InsetMap` does
 * this) and hands the values down through context; the layers build their
 * styles from those. Set the variables on the map's container or any ancestor:
 *
 * | Variable                        | Used for                                                   | Falls back to                                   |
 * | ------------------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
 * | `--column-map-color`            | column footprints (fill and outline)                       | `--text-subtle-color`, then `black`             |
 * | `--column-map-hover-color`      | the column under the pointer / highlighted from elsewhere  | `--selection-color`, then `purple`              |
 * | `--column-map-selection-color`  | the selected column (navigation map), keyboard-nav links   | `--column-map-hover-color`, `--selection-color`, then `purple` |
 * | `--column-map-focus-color`      | the correlation map's focused columns and their order line | `red`                                           |
 *
 * Explicit values can also be passed as `mapColors` to `InsetMap` (and the
 * maps built on it), which take precedence over the variables.
 */
import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useState,
} from "react";
import h from "@macrostrat/hyper";

export interface ColumnMapColors {
  column: string;
  hover: string;
  selection: string;
  focus: string;
}

interface ColorVariableSpec {
  variable: string;
  /** Variables tried in order when the main one is unset. */
  fallbackVariables: string[];
  fallback: string;
}

export const columnMapColorVariables: Record<
  keyof ColumnMapColors,
  ColorVariableSpec
> = {
  column: {
    variable: "--column-map-color",
    fallbackVariables: ["--text-subtle-color"],
    fallback: "black",
  },
  hover: {
    variable: "--column-map-hover-color",
    fallbackVariables: ["--selection-color"],
    fallback: "purple",
  },
  selection: {
    variable: "--column-map-selection-color",
    fallbackVariables: ["--column-map-hover-color", "--selection-color"],
    fallback: "purple",
  },
  focus: {
    variable: "--column-map-focus-color",
    fallbackVariables: [],
    fallback: "red",
  },
};

/** Read the color variables from an element's computed style, following each
 * one's fallback chain. With no element (or outside a browser) every color is
 * its built-in fallback. */
export function resolveColumnMapColors(
  element: Element | null,
  overrides: Partial<ColumnMapColors> = {},
): ColumnMapColors {
  let style: CSSStyleDeclaration | null = null;
  if (element != null && typeof getComputedStyle === "function") {
    style = getComputedStyle(element);
  }
  const read = (name: string): string | null => {
    const value = style?.getPropertyValue(name)?.trim();
    if (value == null || value === "") return null;
    return value;
  };

  const out = {} as ColumnMapColors;
  for (const [key, spec] of Object.entries(columnMapColorVariables)) {
    let value = overrides[key] ?? read(spec.variable);
    for (const fallbackVariable of spec.fallbackVariables) {
      if (value != null) break;
      value = read(fallbackVariable);
    }
    out[key] = value ?? spec.fallback;
  }
  return out;
}

export const defaultColumnMapColors: ColumnMapColors =
  resolveColumnMapColors(null);

const ColumnMapThemeContext = createContext<ColumnMapColors>(
  defaultColumnMapColors,
);

export interface ColumnMapThemeProviderProps {
  /** The element whose computed style carries the variables — the map's
   * container. Falls back to `document.body`. */
  containerRef?: RefObject<HTMLElement | null>;
  /** Explicit colors, taking precedence over the variables. */
  overrides?: Partial<ColumnMapColors>;
  children?: ReactNode;
}

export function ColumnMapThemeProvider({
  containerRef,
  overrides,
  children,
}: ColumnMapThemeProviderProps) {
  const [colors, setColors] = useState<ColumnMapColors>(() =>
    resolveColumnMapColors(null, overrides),
  );

  // Resolved after mount, when the container exists and has its styles. The
  // variables are read once per mount; remount the map to re-theme it.
  const overridesKey = JSON.stringify(overrides ?? {});
  useEffect(() => {
    let element: Element | null = containerRef?.current ?? null;
    if (element == null && typeof document !== "undefined") {
      element = document.body;
    }
    setColors(resolveColumnMapColors(element, overrides));
  }, [overridesKey]);

  return h(ColumnMapThemeContext.Provider, { value: colors }, children);
}

/** The resolved column-map colors for the enclosing map. */
export function useColumnMapColors(): ColumnMapColors {
  return useContext(ColumnMapThemeContext);
}
