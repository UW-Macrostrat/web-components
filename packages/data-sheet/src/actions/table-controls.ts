/**
 * Table-scoped controls expressed as `TableAction`s (no special
 * `dataSheetActions` chrome). They target every cardinality, so they sit in the
 * toolbar regardless of selection — reachable from the one standard actions
 * path like everything else. Opt-in: add them to the `actions` prop.
 */
import h from "@macrostrat/hyper";
import { useState } from "react";
import { Button, ControlGroup, InputGroup } from "@blueprintjs/core";
import { RegionCardinality } from "@blueprintjs/table";
import { useSelector } from "../provider";
import type { TableAction } from "./types";
import { ALL_CARDINALITIES } from "./edit-actions";

function ScrollToRowControl() {
  const [value, setValue] = useState("");
  const scrollToRow = useSelector((s) => s.scrollToRow);
  const go = () => {
    const r = parseInt(value, 10);
    if (!Number.isNaN(r)) scrollToRow(r - 1);
  };
  return h(ControlGroup, [
    h(InputGroup, {
      type: "number",
      placeholder: "Row #",
      value,
      small: true,
      style: { width: "6em" },
      onValueChange: setValue,
      onKeyDown: (e: any) => {
        if (e.key === "Enter") go();
      },
    }),
    h(Button, { small: true, minimal: true, icon: "arrow-right", onClick: go }),
  ]);
}

/** Clear the current selection. Auto-included: appears (on the right, being a
 * general action) whenever something is selected — targets every cardinality
 * except `"none"`. */
export const clearSelectionAction: TableAction = {
  id: "clear-selection",
  name: "Clear selection",
  icon: "cross",
  requiresEditable: false,
  targets: [
    RegionCardinality.CELLS,
    RegionCardinality.FULL_ROWS,
    RegionCardinality.FULL_COLUMNS,
    RegionCardinality.FULL_TABLE,
  ],
  run(ctx) {
    ctx.setState({ selection: [], focusedCell: null, topLeftCell: null });
  },
};

/** Scroll to a 1-based row number. Meaningful for large, addressable sources;
 * add it to `actions`. Present in the toolbar regardless of selection. */
export const scrollToRowAction: TableAction = {
  id: "scroll-to-row",
  name: "Scroll to row",
  icon: "arrow-right",
  targets: ALL_CARDINALITIES,
  requiresEditable: false,
  render: () => h(ScrollToRowControl),
};
