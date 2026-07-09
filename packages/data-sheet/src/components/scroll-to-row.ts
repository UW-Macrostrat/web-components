import { useState } from "react";
import { useSelector } from "../provider.ts";
import h from "@macrostrat/hyper";
import { DataSheetAction } from "./actions.ts";
import { Button, InputGroup } from "@blueprintjs/core";

export function ScrollToRowControl() {
  const [value, setValue] = useState("");
  const scrollToRow = useSelector((state) => state.scrollToRow);

  return h(DataSheetAction, [
    h(InputGroup, {
      type: "number",
      placeholder: "Row number",
      value,
      onValueChange(value) {
        setValue(value);
      },
    }),
    h(
      Button,
      {
        icon: "arrow-right",
        onClick() {
          const row = parseInt(value);
          scrollToRow(row - 1);
        },
      },
      "Scroll to row",
    ),
  ]);
}
