import h from "./main.module.sass";
import { Button } from "@blueprintjs/core";
import { useEffect, useRef } from "react";
import { useSelector } from "../provider";

export type DataEditorProps = {
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
  isEdited?: boolean;
  resetValue?: () => void;
  /** Focus the textarea on mount. Defaults to `true`. The data sheet sets
   * this from the table's `cellInteraction` mode. */
  autoFocus?: boolean;
};

export function EditableTextArea({
  value,
  onChange,
  isEdited,
  resetValue,
  autoFocus = true,
}: DataEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const tableElement = useSelector((s) => s.tableElement);
  const navDirection = useSelector((s) => s.lastNavDirection);

  useEffect(() => {
    if (!autoFocus) return;
    if (ref.current == null) return;
    ref.current.focus();
    // Place the cursor on the side we're travelling toward, so one more arrow
    // in the same direction leaves the cell.
    const atStart = navDirection === "up" || navDirection === "left";
    const pos = atStart ? 0 : (ref.current.value?.length ?? 0);
    ref.current.setSelectionRange(pos, pos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  // Hand keyboard focus (and the in-flight key) back to the table so the
  // arrow key that left the editor navigates in a single press.
  function handOffToTable(evt) {
    evt.preventDefault();
    ref.current?.blur();
    if (tableElement != null) {
      tableElement.focus();
      tableElement.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: evt.key,
          code: evt.code,
          bubbles: true,
          cancelable: true,
        }),
      );
    }
  }

  function onKeyDown(evt) {
    const el = ref.current;
    if (evt.key === "Enter") {
      // Newline stays within the textarea.
      evt.stopPropagation();
      return;
    }
    if (evt.key === "Escape") {
      // Let it bubble to EditorPopup, which closes and refocuses the table.
      return;
    }

    const collapsed = el != null && el.selectionStart === el.selectionEnd;

    // Copy/paste with no text selected: hand off so the table can act on the
    // whole cell/row.
    if (
      collapsed &&
      (evt.key === "c" || evt.key === "v" || evt.key === "x") &&
      (evt.ctrlKey || evt.metaKey)
    ) {
      handOffToTable(evt);
      return;
    }

    // Only leave the editor when the cursor is at the text boundary in the
    // direction of travel — otherwise the arrow moves within the text.
    if (el != null && collapsed) {
      const atStart = el.selectionStart === 0;
      const atEnd = el.selectionStart === el.value.length;
      const leaving =
        ((evt.key === "ArrowUp" || evt.key === "ArrowLeft") && atStart) ||
        ((evt.key === "ArrowDown" || evt.key === "ArrowRight") && atEnd);
      if (leaving) {
        handOffToTable(evt);
        return;
      }
    }

    // Keep every other key inside the textarea; stop it from bubbling (through
    // the portal's React tree) to the table's hotkey handler.
    evt.stopPropagation();
  }

  return h("div.editable-text-area", [
    h("textarea.bp6-input", {
      ref,
      defaultValue: value ?? "",
      onBlur: (evt) => {
        if (evt.target.value !== value) {
          onChange(evt.target.value);
        }
      },
      onKeyDown,
    }),
    h("div.tools", [
      // Tool to reset the value to the default
      h(Button, {
        icon: "undo",
        minimal: true,
        small: true,
        intent: isEdited ? "success" : "none",
        disabled: !isEdited,
        onClick(evt) {
          resetValue?.();
        },
      }),
    ]),
  ]);
}
