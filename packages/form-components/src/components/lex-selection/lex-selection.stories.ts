import type { Meta, StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";

import { LexSelection, LexSelectionProps } from ".";
import { useState } from "react";
import { useAPIResult } from "@macrostrat/ui-components";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Form components/Lex selection",
  component: LexSelection,
} as Meta<LexSelectionProps>;

type Story = StoryObj<LexSelectionProps>;

export function Intervals() {
  const [selected, setSelected] = useState<string | null>(null);
  const intervals = useIntervals();

  if (intervals == null) {
    return h("div", {}, "Loading intervals...");
  }

  return h(LexSelection, {
    value: selected,
    onConfirm: (value) => setSelected(value),
    items: intervals,
    type: "interval",
  });
}


function useIntervals() {
  return useAPIResult(
    "https://dev.macrostrat.org/api/pg/intervals?select=id,color:interval_color,name:interval_name",
  );
}
