import { Meta } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { useState } from "react";
import { SortableItems, SortableDragHandle, type SortableID } from ".";

const h = hyper;

export default {
  title: "Data components/Sortable items",
  component: SortableItems,
  parameters: {
    docs: {
      description: {
        component:
          "A vertical, keyboard-accessible drag-and-drop sortable list built on " +
          "dnd-kit. Reordering is controlled: pass the current order as `ids` " +
          "and update it in `onReorder`. Place a `SortableDragHandle` inside " +
          "`renderItem` to choose the drag affordance.",
      },
    },
  },
} as Meta<typeof SortableItems>;

const LABELS: Record<string, string> = {
  a: "Cambrian",
  b: "Ordovician",
  c: "Silurian",
  d: "Devonian",
  e: "Carboniferous",
};

function BasicExample() {
  const [ids, setIds] = useState<SortableID[]>(["a", "b", "c", "d", "e"]);
  return h("div", { style: { maxWidth: 280, padding: "1em" } }, [
    h(SortableItems, {
      ids,
      onReorder: setIds,
      renderItem: (id) =>
        h([
          h(SortableDragHandle),
          h("span", { style: { flex: 1 } }, LABELS[id as string]),
        ]),
    }),
    h(
      "p",
      { style: { marginTop: "1em", fontFamily: "var(--monospace-font)" } },
      `order: ${ids.join(", ")}`,
    ),
  ]);
}

export const Basic = {
  render: () => h(BasicExample),
};

function RemovableExample() {
  const [ids, setIds] = useState<SortableID[]>(["a", "b", "c", "d", "e"]);
  return h("div", { style: { maxWidth: 280, padding: "1em" } }, [
    h(SortableItems, {
      ids,
      onReorder: setIds,
      renderItem: (id) =>
        h([
          h(SortableDragHandle),
          h("span", { style: { flex: 1 } }, LABELS[id as string]),
          h(
            "button",
            {
              style: { border: "none", background: "none", cursor: "pointer" },
              onClick: () => setIds((prev) => prev.filter((d) => d !== id)),
            },
            "×",
          ),
        ]),
    }),
  ]);
}

export const WithRemoval = {
  render: () => h(RemovableExample),
};
