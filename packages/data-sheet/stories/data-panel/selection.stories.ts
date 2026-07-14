import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import {
  ColumnSpec,
  DataPanel,
  FacetControls,
  ItemComponentProps,
} from "../../src";
import {
  ALL,
  cardStyle,
  CATEGORY_INTENT,
  container,
  fullSpec,
  Sample,
  SampleCard,
} from "./utils.ts";
import { createContext, useContext, useState } from "react";
import { Button, Checkbox, Tag } from "@blueprintjs/core";

/**
 * Progressive-enhancement patterns for `DataPanel`. Scrolling lists are more
 * multi-faceted than a sheet, so the panel exposes a few composable seams —
 * per-column facet opt-in, a `toolbar` slot, a `footer` slot, `bodyStyle` for
 * layout, and `onSelect` for selection — that these stories exercise in
 * isolation. All use a synthetic in-memory dataset (no backend) so the focus is
 * the interaction model, not the data source.
 */

const meta: Meta<any> = {
  title: "Data sheet/Data panel/Selection",
  parameters: { layout: "fullscreen" },
};
export default meta;

// ---- Synthetic dataset ----

// ---- 1. Minimal facets (opt-in / opt-out per column) ----

/**
 * Facets are per-column: `filterable` / `sortable` are opt-in flags on the
 * column spec, so a consumer exposes only what makes sense. Here only
 * `category` is filterable and only `name` / `value` are sortable — the Filter
 * and Sort menus list exactly those, nothing else.
 */
const minimalSpec: ColumnSpec[] = [
  { key: "name", name: "Name", dataType: "text", sortable: true },
  { key: "category", name: "Category", dataType: "string", filterable: true },
  { key: "status", name: "Status", dataType: "string" },
  { key: "value", name: "Value", dataType: "integer", sortable: true },
];

export const SelectableCards: StoryObj = {
  render: () =>
    container(
      h(DataPanel<Sample>, {
        data: ALL,
        identity: (r: Sample) => r.id,
        columnSpec: minimalSpec,
        itemComponent: SampleCard,
        name: "Samples",
      }),
    ),
};

export const SingleSelectionOnly: StoryObj = {
  render: () =>
    container(
      h(DataPanel<Sample>, {
        data: ALL,
        columnSpec: minimalSpec,
        itemComponent: SampleCard,
        name: "Samples",
        enableMultipleSelection: false,
      }),
    ),
};

export const SelectionDisabled: StoryObj = {
  render: () =>
    container(
      h(DataPanel<Sample>, {
        data: ALL,
        columnSpec: minimalSpec,
        itemComponent: SampleCard,
        name: "Samples",
        editable: false,
        enableSelection: false,
      }),
    ),
};

const SelectModeContext = createContext(false);

function LinkCard({ data, selected, onSelect }: ItemComponentProps<Sample>) {
  const selectMode = useContext(SelectModeContext);
  return h(
    "div",
    {
      style: cardStyle(selected),
      // In select-mode the whole card toggles (additive) — one consistent
      // interaction. The checkbox is a pure indicator (pointer-events: none),
      // so clicking *it* falls through to the card rather than fighting it.
      onClick: selectMode ? () => onSelect({ additive: true }) : undefined,
    },
    [
      selectMode
        ? h(Checkbox, {
            checked: selected,
            readOnly: true,
            style: { margin: 0, pointerEvents: "none" },
          })
        : null,
      // A real link: navigates when not selecting; in select-mode the click is
      // neutralized and bubbles to the card's toggle.
      h(
        "a",
        {
          href: `#sample-${data.id}`,
          style: { fontWeight: 600, flex: 1 },
          onClick: (e: any) => {
            if (selectMode) e.preventDefault();
            else e.stopPropagation();
          },
        },
        data.name,
      ),
      h(
        Tag,
        { key: "c", minimal: true, intent: CATEGORY_INTENT[data.category] },
        data.category,
      ),
    ],
  );
}

function ModalSelectionDemo() {
  const [selectMode, setSelectMode] = useState(false);
  const toolbar = h(
    "div",
    { style: { display: "flex", gap: "8px", alignItems: "center" } },
    [
      h(
        Button,
        {
          key: "toggle",
          small: true,
          active: selectMode,
          intent: selectMode ? "primary" : "none",
          icon: selectMode ? "tick-circle" : "selection",
          onClick: () => setSelectMode((v) => !v),
        },
        selectMode ? "Selecting" : "Select",
      ),
      h(FacetControls, { key: "facets" }),
    ],
  );
  return h(
    SelectModeContext.Provider,
    { value: selectMode },
    container(
      h(DataPanel<Sample>, {
        data: ALL,
        identity: (r: Sample) => r.id,
        columnSpec: fullSpec,
        itemComponent: LinkCard,
        toolbar,
        name: "Samples",
      }),
    ),
  );
}

export const ModalSelection: StoryObj = {
  name: "Linkable items + modal selection",
  render: () => h(ModalSelectionDemo),
};
