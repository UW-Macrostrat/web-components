import type { KeyboardEvent } from "react";
import { DataSheetStoreMain } from "@macrostrat/data-sheet";

export function tableKeyHandler<T>(
  e: KeyboardEvent,
  state: DataSheetStoreMain<T>,
) {
  // General key event
  if (e.key === "Escape") {
    // Clear selection on Escape
    state.setSelection([]);
    e.preventDefault();
    e.stopPropagation();
  }
  // Clear selection on Backspace or Delete
  if (e.key === "Backspace" || e.key === "Delete") {
    // Clear selection on Backspace or Delete
    state.clearSelection();
    e.preventDefault();
  }
  // Handle arrow keys for navigation
  if (e.key in directionMap) {
    // Handle arrow key navigation
    const direction = directionMap[e.key];
    state.moveFocusedCell(direction);
    // Prevent default scrolling behavior
    e.preventDefault();
  }
  if (e.key === "Tab") {
    state.moveFocusedCell(e.shiftKey ? "left" : "right");
    e.preventDefault();
  }
  if (e.key === "Enter") {
    state.moveFocusedCell("down");
    e.preventDefault();
  }
}

const directionMap = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export function editorKeyHandler(
  e: KeyboardEvent,
  isSingleCellSelection: boolean,
) {
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
