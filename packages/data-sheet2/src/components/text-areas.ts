import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import { Button } from "@blueprintjs/core";
import { useEffect, useRef } from "react";

const h = hyper.styled(styles);

export function EditableTextArea({ value, onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current == null) return;
    ref.current.focus();
    // Get the current value
    const val = ref.current.value;
    // Move the cursor to the end of the text
    ref.current.setSelectionRange(val.length, val.length);
  }, []);

  return h("div.editable-text-area", [
    h("textarea.bp5-input", {
      ref,
      value: value ?? "",
      onChange: (evt) => onChange(evt.target.value),
      onKeyDown: (evt) => {
        if (evt.key === "Enter") {
          onChange(value + "\n");
          evt.preventDefault();
        }
        // If we're at the end of the text and press the right arrow key, return focus to the data sheet
        if (evt.key == "Escape") {
          return;
        }

        if (
          (evt.key === "ArrowLeft" ||
            evt.key === "Tab" ||
            evt.key === "Enter" ||
            evt.key === "ArrowUp") &&
          ref.current.selectionStart === 0
        ) {
          ref.current.blur();
          evt.preventDefault();
          return;
        }

        if (
          (evt.key === "ArrowRight" ||
            evt.key === "Tab" ||
            evt.key === "Enter" ||
            evt.key === "ArrowDown") &&
          ref.current.selectionStart === evt.target.value.length
        ) {
          ref.current.blur();
          evt.preventDefault();
          return;
        }
        evt.stopPropagation();
      },
    }),
    h("div.tools", [
      h(Button, {
        icon: "key-enter",
        minimal: true,
        small: true,
        onClick() {
          // Get cursor position
          let _value = value ?? "";

          const cursorPos = ref.current.selectionStart ?? _value.length;
          // Insert a newline at the cursor position
          onChange(_value.slice(0, cursorPos) + "\n" + _value.slice(cursorPos));
          // Re-focus the textarea
          ref.current.focus();
          // Move the cursor to the end of the line
          ref.current.setSelectionRange(cursorPos + 1, cursorPos + 1);
        },
      }),
    ]),
  ]);
}
