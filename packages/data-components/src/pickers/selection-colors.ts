/**
 * Selection colours: what is chosen inside an item's editor — its attributes
 * in a list, its proportion's term — drawn in the item's own tag colours.
 *
 * Sets `--item-color` (the tag's text colour), `--selected-color` and
 * `--selected-background-color` (its text and background), which the
 * pickers' styles read with neutral fallbacks. They are set as variables on
 * the element, as a tag's own colours are, so a list portalled out of its
 * editor can be handed them too.
 */
import { useMemo } from "react";
import { useInDarkMode } from "@macrostrat/ui-components";
import type chroma from "chroma-js";
import { buildTagStyle } from "../components/unit-details/tag";

export type SelectionColor = chroma.ChromaInput | null | undefined;

/** The selection variables for a colour; empty without one. */
export function useSelectionColors(
  color: SelectionColor,
): Record<string, string> {
  const inDarkMode = useInDarkMode();
  return useMemo((): Record<string, string> => {
    if (color == null) return {};
    const tag = buildTagStyle({ color, inDarkMode });
    return {
      "--item-color": tag["--text-color"],
      "--selected-color": tag["--text-color"],
      "--selected-background-color": tag["--tag-background"],
    };
  }, [color, inDarkMode]);
}
