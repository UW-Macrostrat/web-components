import { atom } from "jotai";
import { interactionOptionsAtom } from "./interactions.ts";
import { storeAtom } from "./core.ts";
import type { Region } from "@blueprintjs/table";

// The anchor for shift-range selection: the last row clicked without shift.
// Reset when the selection is cleared elsewhere (e.g. the toolbar's ✕).
export const anchorRefAtom = atom<{ current: number | null }>({
  current: null,
});

export const selectionAtom = atom(
  (get) => {
    if (!get(interactionOptionsAtom).enableSelection) return [];
    return get(storeAtom)?.selection ?? [];
  },
  (get, set, regions: Region[] = []) => {
    /** Don't do anything if selection isn't enabled */
    if (!get(interactionOptionsAtom).enableSelection) return;
    /** Reset the selection anchor ref */
    if (regions.length === 0) {
      get(anchorRefAtom).current = null;
    }
    set(storeAtom, (s) => ({
      ...s,
      selection: regions,
      focusedCell: null,
      topLeftCell: null,
    }));
  },
);
