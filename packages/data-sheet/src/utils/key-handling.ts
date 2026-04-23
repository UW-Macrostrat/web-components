import type { KeyboardEvent } from "react";
import { storeAPIAtom, storeAtom, tableActionsAtom } from "../provider";
import type { DataSheetStoreMain } from "../types";
import { atom } from "jotai";
import { singleFocusedCell } from "../zustand-store.ts";
import {
  buildActionContext,
  copyAction,
  pasteAction,
  serializeSelectionToTSV,
} from "../actions";
import { HotkeyConfig } from "@blueprintjs/core";
import { toasterAtom } from "../notifications.ts";

type HotkeyActionRunner = (
  e: KeyboardEvent,
  state: DataSheetStoreMain<any>,
  setState: (state: Partial<DataSheetStoreMain<any>>) => void,
) => void | Promise<void>;

const isEditableAtom = atom((get) => {
  const store = get(storeAtom);
  return store?.editable ?? false;
});

const hasSelectionAtom = atom((get) => {
  const store = get(storeAtom);
  const selection = store?.selection ?? [];
  return selection.length > 0;
});

export const tableHotkeysAtom = atom<HotkeyConfig[]>((get) => {
  const store = get(storeAPIAtom);
  const toaster = get(toasterAtom);
  const editable = get(isEditableAtom);
  const hasSelection = get(hasSelectionAtom);
  if (store == null) return [];
  const keyHandler = (actionRunner: HotkeyActionRunner) => {
    return (e: KeyboardEvent) => {
      // Kind of a ridiculous hack to get the store from the atom.
      const state = store.getState();
      const setState = store.setState;
      try {
        const res = actionRunner(e, state, setState);
        if (res instanceof Promise) {
          res
            .then(() => {})
            .catch((err) => {
              console.error(err);
              handleError(toaster, err);
            });
        }
      } catch (err) {
        handleError(toaster, err);
      }
    };
  };

  function handleError(toaster, err) {
    toaster.show({
      message: `${err}`,
      intent: "danger",
    });
  }

  const directionCombos = ["up", "down", "left", "right"].map((dir) => {
    return {
      combo: dir,
      group: "Navigation",
      label: "Move focus " + dir,
      preventDefault: true,
      onKeyDown: keyHandler((e, state) => {
        state.moveFocusedCell(dir);
      }),
    };
  });

  /** TODO: merge a bit more with the actions config */

  const selectionCombos: HotkeyConfig[] = [
    {
      combo: "esc",
      label: "Clear selection",
      group: "Selection",
      allowInInput: true,
      onKeyDown: keyHandler((e, state) => {
        if (state.selection.length == 0) {
          // Focus goes back to parent
          return;
        }
        state.setSelection([]);
        e.preventDefault();
        e.stopPropagation();
      }),
    },
    {
      combo: "backspace",
      label: "Clear selection",
      group: "Selection",
      allowInInput: true,
      onKeyDown: keyHandler((e, state) => {
        state.clearSelection();
      }),
    },
    {
      combo: "tab",
      label: "Move focus right (or left with shift)",
      group: "Navigation",
      allowInInput: true,
      onKeyDown: keyHandler((e, state) => {
        state.moveFocusedCell(e.shiftKey ? "left" : "right");
      }),
    },
    {
      combo: "enter",
      label: "Move focus down",
      group: "Navigation",
      allowInInput: true,
      onKeyDown: keyHandler((e, state) => {
        state.moveFocusedCell("down");
      }),
    },
    ...directionCombos,
    {
      combo: copyAction.hotkey,
      label: "Copy",
      group: "Clipboard",
      //allowInInput: true,
      onKeyDown: keyHandler(async (e, state, setState) => {
        e.preventDefault();
        const ctx = buildActionContext(state, setState);
        await copyAction.run(ctx);
      }),
    },
    {
      combo: copyAction.hotkey,
      label: "Copy",
      group: "Clipboard",
      //allowInInput: true,
      onKeyDown: keyHandler(async (e, state, setState) => {
        e.preventDefault();
        const ctx = buildActionContext(state, setState);
        await copyAction.run(ctx);
      }),
    },
    {
      combo: pasteAction.hotkey,
      label: "Paste",
      group: "Clipboard",
      disabled: !(editable && hasSelection),
      onKeyDown: keyHandler(async (e, state, setState) => {
        e.preventDefault();
        const ctx = buildActionContext(state, setState);
        await pasteAction.run(ctx);
      }),
    },
    {
      combo: "mod+r",
      label: "Reset changes",
      group: "Editing",
      allowInInput: true,
      disabled: !(editable && hasSelection),
      preventDefault: true,
      stopPropagation: true,
      onKeyDown: keyHandler(async (e, state, setState) => {
        const ctx = buildActionContext(state, setState);
        ctx.resetChanges(ctx.selection);
        console.log("Reset changes");
      }),
    },
  ];

  return selectionCombos;
});

const selectionAtom = atom((get) => {
  const store = get(storeAtom);
  return store.selection;
});

const isSingleCellSelectionAtom = atom((get) => {
  const selection = get(selectionAtom);
  return singleFocusedCell(selection) != null;
});

const tableRefAtom = atom((get) => {
  const store = get(storeAtom);
  return store?.tableRef.current;
});

export const editorKeyHandlerAtom = atom((get) => {
  return (e: KeyboardEvent) => {
    const isSingleCellSelection = get(isSingleCellSelectionAtom);
    const tableElement = get(tableRefAtom);
    editorKeyHandler(e, isSingleCellSelection, tableElement);
  };
});

function editorKeyHandler(
  e: KeyboardEvent<HTMLInputElement>,
  isSingleCellSelection: boolean,
) {
  /** Get a key handler for inline cell editing */

  // if (e.key == "Enter" || e.key == "Tab") {
  //   e.target.blur();
  //   return;
  // }

  const target = e.target as HTMLInputElement;

  console.log("Editor key handler", e.key);

  // if (e.key == "Escape") {
  //   // Blur the editor but don't clear the selection
  //   target.blur();
  //   e.preventDefault();
  //   e.stopPropagation();
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
    target.blur();
    e.preventDefault();
    console.log("Editor key handler - not capturing event");
    return;
  }

  const shouldPropagate = shouldPropagateKeystroke(e);
  if (!shouldPropagate) {
    console.log("Editor key handler - not propagating event");
    e.stopPropagation();
    //e.preventDefault();
  } else {
    console.log("Editor key handler - propagating event");
    //e.stopPropagation();
    // we blur the editor and dispatch a keydown event on the parent to propagate the event to the table
    e.preventDefault();
    target.blur();
    //console.log(tableElement);
    //tableElement.focus();
    //target.parentNode?.dispatchEvent(e);
    console.log("propagating event to parent", e);
    target.parentNode?.dispatchEvent(new KeyboardEvent("keydown", e));
  }
}

function shouldPropagateKeystroke(evt: KeyboardEvent): boolean {
  if (evt.target.selectionStart == evt.target.selectionEnd) {
    // We don't have anything selected, so we can propagate the event potentially
    // Propagate copy and paste events even if there is no selection, since they might want to copy/paste an entire row/column based on the focused cell.
    if (evt.key === "c" || evt.key === "v" || evt.key === "x") {
      if (evt.ctrlKey || evt.metaKey) {
        return true;
      }
    }
  }

  if (evt.key === "ArrowUp" || evt.key === "ArrowDown") {
    return true;
  }

  const target = evt.target;
  if (
    (evt.key === "ArrowLeft" ||
      evt.key === "ArrowUp" ||
      evt.key === "ArrowDown") &&
    target.selectionStart === 0
  ) {
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
    return true;
  }

  return false;
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

  const shouldPropagate = shouldPropagateKeystroke(evt);
  if (!shouldPropagate) {
    evt.stopPropagation();
  } else {
    evt.target.blur();
  }
}
