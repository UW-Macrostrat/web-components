import h from "./main.module.sass";
import { Button } from "@blueprintjs/core";
import { useEffect, useRef, useState } from "react";
import { multiLineTextKeyHandler } from "../utils";

export type DataEditorProps = {
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
  isEdited?: boolean;
  resetValue?: () => void;
};

export function EditableTextArea({
  value,
  onChange,
  isEdited,
  resetValue,
}: DataEditorProps) {
  const ref = useRef(null);

  // const [_value, setValue] = useState(value);
  //
  // useEffect(() => {
  //   setValue(value);
  // }, [value]);

  useEffect(() => {
    if (ref.current == null) return;
    ref.current.focus();
    // Get the current value
    const val = ref.current.value;
    // Move the cursor to the end of the text
    ref.current.setSelectionRange(val.length, val.length);
  }, []);

  return h("div.editable-text-area", [
    h("textarea.bp6-input", {
      ref,
      defaultValue: value ?? "",
      //onChange: (evt) => setValue(evt.target.value),
      onBlur: (evt) => {
        if (evt.target.value !== value) {
          onChange(evt.target.value);
        }
      },
      onKeyDown: multiLineTextKeyHandler,
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
