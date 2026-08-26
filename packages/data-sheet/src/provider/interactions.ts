import { RegionCardinality } from "@blueprintjs/table";
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

const defaultInteractionOptions: InteractionOptionsResolved = {
  enableEditing: false,
  enableSelection: false,
  enableModalSelection: false,
  enableMultipleSelection: false,
  enableDragValue: false,
  selectionModes: [],
};

/** Atom to store interaction options state */
export const interactionOptionsAtom = atom<InteractionOptionsResolved>(
  defaultInteractionOptions,
);

export enum SelectionInteractionStyle {
  ALWAYS = "always",
  NEVER = "never",
  MODAL = "modal",
}

export interface InteractionOptions {
  /** Options for data interaction (editing and selection) */
  /** @deprecated: Use enableEditing instead */
  editable?: boolean;
  enableEditing?: boolean;
  enableSelection?: boolean | SelectionInteractionStyle;
  enableMultipleSelection?: boolean;
  // Enable drag-to-select (data table only)
  enableDragValue?: boolean;
  selectionModes?: RegionCardinality[];
  interactionOptions?: InteractionOptionsResolved;
}

export const interactionOptionsKeys: Set<keyof InteractionOptions> = new Set([
  "editable",
  "enableEditing",
  "enableSelection",
  "enableMultipleSelection",
  "enableDragValue",
  "selectionModes",
  "interactionOptions",
]);

/** Resolve the granular interaction options for a particular editing domain */
export function resolveInteractionOptions(
  opts: InteractionOptions,
  renderer: DataViewRendererType,
): InteractionOptionsResolved {
  // If the user has provided interaction options, use them.
  if (opts.interactionOptions) return opts.interactionOptions;

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

/**
 * Whether **modal** selection is currently switched on.
 *
 * This is *runtime view state*, not configuration, so it lives in its own atom
 * rather than inside `interactionOptionsAtom`: the latter is re-synced from the
 * view's props (`resolveInteractionOptions` builds a fresh object on every
 * render of the provider), so a runtime override stored there is reset by any
 * provider re-render that happens to fire. Keeping the flag separate makes
 * select mode stable, and gives consumers a single, safe thing to read and set.
 */
export const selectionModeActiveAtom = atom(false);

/**
 * The effective "is selection live right now" flag — the one every selection
 * path should read. For a modal view it follows {@link selectionModeActiveAtom};
 * otherwise it's the configured `enableSelection`.
 */
export const enableSelectionAtom = atom(
  (get) => {
    const options = get(interactionOptionsAtom);
    if (options.enableModalSelection) return get(selectionModeActiveAtom);
    return options.enableSelection;
  },
  (get, set, next: boolean) => {
    /** Turn selection on/off. Only meaningful for a modal view; a view with a
     * fixed selection style ignores it. */
    if (!get(interactionOptionsAtom).enableModalSelection) return;
    set(selectionModeActiveAtom, next);
  },
);

export const enableDragValueAtom = atom((get) => {
  return get(interactionOptionsAtom).enableDragValue;
});
export const dragValueHandlerAtom = atom((get) => {
  if (!get(enableDragValueAtom)) return undefined;
  return get(storeAtom)?.onDragValue;
});
