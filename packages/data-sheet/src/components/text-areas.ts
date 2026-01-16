import hyper from "@macrostrat/hyper";
import styles from "./main.module.sass";
import { Button } from "@blueprintjs/core";
import { useEffect, useRef } from "react";
import { multiLineTextKeyHandler } from "../utils";

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
      onKeyDown: multiLineTextKeyHandler,
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
