import type { KeyboardEvent } from "react";
import { storeAPIAtom, storeAtom, tableActionsAtom } from "../provider";
import type { DataSheetStoreMain } from "../provider/types.ts";
import { atom } from "jotai";
import { singleFocusedCell } from "../provider/zustand-store.ts";
import { buildActionContext, runActionWrapper } from "../actions";
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

  /** Set up hotkeys for table actions */
  const tableActions = get(tableActionsAtom);

  if (store == null) return [];
  const keyHandler = (
    actionRunner: HotkeyActionRunner,
  ): HotkeyConfig["onKeyDown"] => {
    return (e) => {
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

  const actionsCombos = tableActions
    .map((action) => {
      if (action.hotkey == null) return null;
      return {
        combo: action.hotkey,
        label: action.name,
        group: action.group ?? "Actions",
        preventDefault: true,
        disabled: action.requiresEditable !== false && !editable,
        onKeyDown(event: KeyboardEvent<any>): any {
          const state = store.getState();
          const setState = store.setState;
          runActionWrapper(action, state, setState, toaster);
        },
      } as any as HotkeyConfig;
    })
    .filter(Boolean) as HotkeyConfig[];

  // Backspace/Delete: on a whole-row selection, delete the row(s); otherwise
  // clear the selected cells.
  const clearOrDeleteSelection = keyHandler((e, state) => {
    const sel = state.selection ?? [];
    const isRowSelection =
      sel.length > 0 && sel.every((r) => r.cols == null && r.rows != null);
    if (isRowSelection) {
      state.deleteSelectedRows();
    } else {
      state.clearSelection();
    }
  });

  return [
    {
      combo: "esc",
      label: "Exit editing / clear selection",
      group: "Selection",
      allowInInput: true,
      onKeyDown: keyHandler((e, state) => {
        // First Escape closes the focused cell's open surface (editor/panel)
        // while keeping the selection, so arrow keys keep working — in both
        // auto and manual modes. A second Escape (nothing open) clears the
        // selection.
        if (state.cellSurfaceOpen) {
          state.closeCellSurface();
          e.preventDefault();
          e.stopPropagation();
          return;
        }
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
      label: "Clear cells / delete rows",
      group: "Selection",
      allowInInput: true,
      disabled: !editable,
      onKeyDown: clearOrDeleteSelection,
    },
    {
      combo: "del",
      label: "Clear cells / delete rows",
      group: "Selection",
      allowInInput: true,
      disabled: !editable,
      onKeyDown: clearOrDeleteSelection,
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
      label: "Edit cell / move focus down",
      group: "Navigation",
      allowInInput: true,
      onKeyDown: keyHandler((e, state) => {
        // In navigation mode (no surface open), Enter enters edit mode —
        // opening and focusing the focused cell's surface (Google Sheets
        // style). While a surface is open, Enter advances downward as usual
        // (an inline editor blurs and this moves to the next row).
        if (!state.cellSurfaceOpen) {
          state.armAutoActivate();
          state.openCellSurface();
          e.preventDefault();
          return;
        }
        state.moveFocusedCell("down");
      }),
    },
    {
      combo: "f2",
      label: "Edit / open cell",
      group: "Editing",
      onKeyDown: keyHandler((e, state) => {
        // Enter edit mode from the keyboard: re-arm auto-activation and open
        // the focused cell's surface (which focuses the editor).
        state.armAutoActivate();
        state.openCellSurface();
        e.preventDefault();
      }),
    },
    ...directionCombos,
    ...actionsCombos,
  ];
});

const selectionAtom = atom((get) => {
  const store = get(storeAtom);
  return store.selection;
});

const isSingleCellSelectionAtom = atom((get) => {
  const selection = get(selectionAtom);
  return singleFocusedCell(selection) != null;
});

export const editorKeyHandlerAtom = atom((get) => {
  const store = get(storeAPIAtom);
  return (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      // Escape exits the inline editor: close the surface (which enters
      // navigation mode in auto), keep the selection, and return focus to the
      // table so arrow keys navigate. Stop propagation so the table's own
      // Escape hotkey doesn't also fire.
      const state = store?.getState();
      state?.closeCellSurface();
      state?.tableElement?.focus();
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const isSingleCellSelection = get(isSingleCellSelectionAtom);
    editorKeyHandler(e, isSingleCellSelection);
  };
});

function editorKeyHandler(
  e: KeyboardEvent<HTMLInputElement>,
  isSingleCellSelection: boolean,
) {
  /** Get a key handler for inline cell editing */

  const target = e.target as HTMLInputElement;

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
    return;
  }

  const shouldPropagate = shouldPropagateKeystroke(e);
  if (!shouldPropagate) {
    e.stopPropagation();
    //e.preventDefault();
  } else {
    // we blur the editor and dispatch a keydown event on the parent to propagate the event to the table
    e.preventDefault();
    target.blur();
    //console.log(tableElement);
    //tableElement.focus();
    //target.parentNode?.dispatchEvent(e);
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
