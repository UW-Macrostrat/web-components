import { RegionCardinality } from "@blueprintjs/table";
import { InteractionOptions, SelectionInteractionStyle } from "../types.ts";
import { atom } from "jotai";
import { storeAtom } from "./core.ts";

export enum DataViewRendererType {
  CARDS = "cards",
  TABLE = "table",
}

export interface InteractionOptionsResolved {
  enableEditing: boolean;
  enableSelection: boolean;
  // We have a potentially modal selection
  enableModalSelection: boolean;
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
  renderer: DataViewRendererType,
): InteractionOptionsResolved {
  /** Resolve a unified set of interaction options for the table and cards */
  let {
    enableEditing,
    selectionModes,
    enableSelection: _enableSelection,
    enableDragValue,
    enableMultipleSelection,
  } = opts;

  if (renderer == DataViewRendererType.CARDS) {
    _enableSelection ??= true;
  }

  let enableSelection: boolean;
  let enableModalSelection = false;
  if (typeof _enableSelection === "string") {
    switch (_enableSelection) {
      case SelectionInteractionStyle.ALWAYS:
        enableSelection = true;
        break;
      case SelectionInteractionStyle.NEVER:
        enableSelection = false;
        break;
      case SelectionInteractionStyle.MODAL:
        enableSelection = false;
        enableModalSelection = true;
        break;
    }
  } else {
    enableSelection ??= _enableSelection ?? true;
  }

  enableEditing ??= opts.editable ?? enableSelection ?? true;
  enableMultipleSelection ??= true;
  if (renderer == DataViewRendererType.TABLE) {
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
      selectionModes ??= [RegionCardinality.FULL_TABLE];
    }
    if (!selectionModes.includes(RegionCardinality.CELLS)) {
      enableEditing = false;
    }
    enableDragValue ??= enableEditing;
  } else if (renderer == DataViewRendererType.CARDS) {
    if (enableSelection) {
      // Only one selection mode possible
      selectionModes = [
        RegionCardinality.FULL_ROWS,
        RegionCardinality.FULL_TABLE,
      ];
      enableEditing ??= true;
    } else {
      selectionModes = [RegionCardinality.FULL_TABLE];
    }
    enableDragValue = false;
  }
  if (!enableEditing) {
    enableDragValue = false;
  }

  return {
    enableEditing,
    enableDragValue: enableDragValue ?? false,
    enableMultipleSelection,
    selectionModes: selectionModes as RegionCardinality[],
    enableModalSelection,
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
