import { RegionCardinality } from "@blueprintjs/table";
import { InteractionOptions } from "../types.ts";
import { atom } from "jotai";
import { storeAtom } from "./core.ts";

enum DataPanelRendererType {
  CARDS = "cards",
  TABLE = "table",
}

export interface InteractionOptionsResolved {
  enableEditing: boolean;
  enableSelection: boolean;
  /** Options for data interaction (editing and selection) */
  enableMultipleSelection: boolean;
  // Enable drag-to-select (data table only)
  enableDragValue: boolean;
  selectionModes: RegionCardinality[];
}

export const interactionOptionsAtom = atom<InteractionOptionsResolved>({
  enableEditing: false,
  enableSelection: false,
  enableMultipleSelection: false,
  enableDragValue: false,
  selectionModes: [],
});

export function resolveInteractionOptions(
  opts: InteractionOptions,
  renderer: DataPanelRendererType,
): InteractionOptionsResolved {
  /** Resolve a unified set of interaction options for the table and cards */
  let {
    enableEditing,
    selectionModes,
    enableDragValue,
    enableSelection,
    enableMultipleSelection,
  } = opts;

  enableEditing ??= opts.editable ?? opts.enableSelection ?? true;
  enableSelection ??= true;
  if (renderer == DataPanelRendererType.TABLE) {
    if (selectionModes != null) {
      enableSelection = new Set(selectionModes).size > 0;
    }
    enableSelection ??= true;
    if (enableSelection) {
      selectionModes ??= [
        RegionCardinality.FULL_TABLE,
        RegionCardinality.CELLS,
        RegionCardinality.FULL_ROWS,
        RegionCardinality.FULL_COLUMNS,
      ];
      enableEditing ??= true;
      enableDragValue ??= true;
    } else {
      selectionModes ??= [];
    }
    if (!selectionModes.includes(RegionCardinality.CELLS)) {
      enableEditing = false;
    }
    enableDragValue ??= enableEditing;
  } else if (renderer == DataPanelRendererType.CARDS) {
    if (enableSelection) {
      // Only one selection mode possible
      selectionModes = [RegionCardinality.FULL_ROWS];
      enableEditing ??= true;
    } else {
      selectionModes = [];
    }
    enableDragValue = false;
  }
  enableMultipleSelection ??= true;
  if (!enableEditing) {
    enableDragValue = false;
    enableMultipleSelection = false;
  }

  return {
    enableEditing,
    enableDragValue: enableDragValue ?? false,
    enableMultipleSelection,
    selectionModes: selectionModes as RegionCardinality[],
    enableSelection,
  };
}

export const enableDragValueAtom = atom((get) => {
  return get(interactionOptionsAtom).enableDragValue;
});
export const dragValueHandlerAtom = atom((get) => {
  if (!get(enableDragValueAtom)) return undefined;
  return get(storeAtom)?.onDragValue;
});
