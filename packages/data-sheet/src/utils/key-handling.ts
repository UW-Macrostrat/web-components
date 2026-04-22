import type { KeyboardEvent } from "react";
import { storeAPIAtom, storeAtom, tableActionsAtom } from "../provider";
import type { DataSheetStoreMain } from "../types";
import { atom } from "jotai";
import { singleFocusedCell } from "../zustand-store.ts";
import { buildActionContext, TableAction } from "../actions";
import { HotkeyConfig, UseHotkeysReturnValue } from "@blueprintjs/core";

export const tableKeyHandlerAtom = atom((get) => {
  const store = get(storeAPIAtom);
  const actions = get(tableActionsAtom);
  return (e: KeyboardEvent) => {
    // Kind of a ridiculous hack to get the store from the atom.
    const state = store.getState();
    const setState = store.setState;
    tableKeyHandler(e, state, setState, actions);
  };
});

export function buildTableHotkeys(): HotkeyConfig[] {
  return [
    {
      combo: "F",
      group: "Input",
      label: "Focus text input",
      onKeyDown: console.log,
    },
  ];
}

export function tableKeyHandler<T>(
  e: KeyboardEvent,
  state: DataSheetStoreMain<T>,
  setState: (state: Partial<DataSheetStoreMain<T>>) => void,
  actions: TableAction[],
) {
  // General key event
  if (e.key === "Escape") {
    // Clear selection on Escape
    state.setSelection([]);
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  // Clear selection on Backspace or Delete
  if (e.key === "Backspace" || e.key === "Delete") {
    // Clear selection on Backspace or Delete
    state.clearSelection();
    e.preventDefault();
    return;
  }
  // Handle arrow keys for navigation
  if (e.key in directionMap) {
    // Handle arrow key navigation
    const direction = directionMap[e.key];
    state.moveFocusedCell(direction);
    // Prevent default scrolling behavior
    e.preventDefault();
    return;
  }
  if (e.key === "Tab") {
    state.moveFocusedCell(e.shiftKey ? "left" : "right");
    e.preventDefault();
    return;
  }
  if (e.key === "Enter") {
    state.moveFocusedCell("down");
    e.preventDefault();
    return;
  }

  console.log("Key pressed:", e.key);

  return;
  // Now, find actions with hotkeys and handle them
  for (const action of actions) {
    if (action.hotkey == null) continue;
    console.log("Checking action:", action.hotkey);
    if (!matchBlueprintKeyCode(e, action.hotkey)) continue;
    const ctx = buildActionContext(state, setState);

    if (action.isReady != null) {
      throw new Error("Action with isReady is not supported in hotkeys");
    }
    action.run(ctx);
    e.preventDefault();
    return;
  }
}

const directionMap = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

const selectionAtom = atom((get) => {
  const store = get(storeAtom);
  return store.selection;
});

const isSingleCellSelectionAtom = atom((get) => {
  const selection = get(selectionAtom);
  return singleFocusedCell(selection) != null;
});

export const editorKeyHandlerAtom = atom((get) => {
  return (e: KeyboardEvent) => {
    const isSingleCellSelection = get(isSingleCellSelectionAtom);
    editorKeyHandler(e, isSingleCellSelection);
  };
});

function editorKeyHandler(e: KeyboardEvent, isSingleCellSelection: boolean) {
  /** Get a key handler for inline cell editing */

  // if (e.key == "Enter" || e.key == "Tab") {
  //   e.target.blur();
  //   return;
  // }

  let shouldCaptureEventForInlineEditing = true;

  if (e.key == "Enter") {
    shouldCaptureEventForInlineEditing = e.shiftKey;
  }

  if (e.key == "Escape" || e.key == "Tab") {
    shouldCaptureEventForInlineEditing = false;
  }

  if (e.key == "Backspace" || e.key == "Delete") {
    /** Clear selection on Backspace or Delete on a multi-cell selection
     * (if shift is held, we allow deletion in a single cell)
     */
    shouldCaptureEventForInlineEditing = isSingleCellSelection && !e.shiftKey;
  }

  if (!shouldCaptureEventForInlineEditing) {
    e.target.blur();
    e.preventDefault();
    return;
  }

  const shouldPropagate = handleSpecialKeys(e);
  if (!shouldPropagate) {
    e.stopPropagation();
  } else {
    e.target.blur();
    //e.target.parentNode.dispatchEvent(new KeyboardEvent("keydown", e));
  }
}

export function multiLineTextKeyHandler(evt: InputEvent) {
  if (evt.key === "Enter") {
    //evt.preventDefault();
    evt.stopPropagation();
    return;
  }

  if (evt.key === "Escape") {
    evt.preventDefault();
    return;
  }

  const shouldPropagate = handleSpecialKeys(evt);
  if (!shouldPropagate) {
    evt.stopPropagation();
  }
}

function handleSpecialKeys(evt: KeyboardEvent): boolean {
  const target = evt.target;
  if (
    (evt.key === "ArrowLeft" ||
      evt.key === "ArrowUp" ||
      evt.key === "ArrowDown") &&
    target.selectionStart === 0
  ) {
    target.blur();
    return true;
  }

  if (
    (evt.key === "ArrowRight" ||
      evt.key === "ArrowUp" ||
      evt.key === "Tab" ||
      evt.key === "Enter" ||
      evt.key === "ArrowDown") &&
    target.selectionStart === evt.target.value.length
  ) {
    target.blur();
    return true;
  }

  return false;
}

function matchBlueprintKeyCode(evt: KeyboardEvent, combo: string) {
  // Map some common keys to their Blueprint equivalents
  const lowerCaseCombo = combo.toLowerCase();
  const keys = lowerCaseCombo.split("+").map((key) => key.trim());
  const nKeys = keys.length;
  if (nKeys === 1) {
    return evt.key === keys[0];
  }
  if (keys[0] == "mod") {
    if (!evt.ctrlKey && !evt.metaKey) {
      return false;
    }
  }
  if (keys[0] == "shift") {
    if (!evt.shiftKey) {
      return false;
    }
  }
  if (keys[0] == "alt") {
    if (!evt.altKey) {
      return false;
    }
  }
  if (keys[0] == "ctrl") {
    if (!evt.ctrlKey) {
      return false;
    }
  }
  if (keys[0] == "meta") {
    if (!evt.metaKey) {
      return false;
    }
  }
  return keys.slice(1).every((key) => evt.key === key);
}
