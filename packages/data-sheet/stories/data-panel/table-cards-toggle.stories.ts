// A spec with a Tags column so the *table* view shows tag edits too (the card
// renders them as chips).
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColumnSpec, DataView } from "../../src";
import { useMemo, useState } from "react";
import { SegmentedControl } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import {
  makeEditableProvider,
  fullSpec,
  container,
  Sample,
  addTagAction,
  removeTagAction,
  TaggedCard,
} from "./utils";

const meta: Meta<any> = {
  title: "Data sheet/Data panel/Table – cards toggle",
  parameters: { layout: "fullscreen" },
};
export default meta;

const toggleSpec: ColumnSpec[] = [
  ...fullSpec,
  { key: "tags", name: "Tags", dataType: "array" },
];

function TableCardsDemo() {
  const [view, setView] = useState<"cards" | "table">("cards");
  // One shared provider (data + saveRows); `DataView` also shares one store
  // across the toggle, so selection / sort / filter persist too.
  const provider = useMemo(makeEditableProvider, []);

  const toggle = h(SegmentedControl, {
    small: true,
    options: [
      { label: "Cards", value: "cards" },
      { label: "Table", value: "table" },
    ],
    value: view,
    onValueChange: (v: string) => setView(v as "cards" | "table"),
  });

  return container(
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: "8px",
        },
      },
      [
        h(
          "div",
          {
            key: "bar",
            style: { display: "flex", alignItems: "center", gap: "8px" },
          },
          [h("b", { key: "l" }, "View:"), toggle],
        ),
        h(
          "div",
          {
            key: "view",
            style: {
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            },
          },
          h(DataView<Sample>, {
            view,
            provider,
            columnSpec: toggleSpec,
            actions: [addTagAction, removeTagAction],
            itemComponent: TaggedCard,
            pageSize: 25,
            name: "Samples",
          }),
        ),
      ],
    ),
  );
}

/**
 * **Table ⇄ cards toggle** via `DataView`, which mounts one shared store and
 * swaps the renderer. The same provider, column spec, and (generic) edit
 * actions drive either the card `DataPanel` or the cell `DataSheet`. Because the
 * store is shared, **selection / sort / filter persist across the toggle**, and
 * edits (via the shared edit seam) show in both. The realized headless core:
 * one data + behavior definition, two presentations.
 */
export const Primary: StoryObj = {
  render: () => h(TableCardsDemo),
};
