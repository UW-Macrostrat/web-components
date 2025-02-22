import type { Meta, StoryFn } from "@storybook/react";
import h from "@macrostrat/hyper";
import Box from "ui-box";
import { ToasterContext } from "@macrostrat/ui-components";
import { useState } from "react";
import { ItemSelect } from ".";
import {
  BaseDataTypeSelect,
  BaseMapLayerSelect,
  MapLayer,
  DataType,
} from "./examples";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Form components/Item select",
  component: ItemSelect,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
  decorators: [
    (Story: StoryFn<typeof ItemSelect>) =>
      h(Box, { width: "450px" }, h(ToasterContext, h(Story))),
  ],
} as Meta<typeof ItemSelect>;

export function MapLayerSelect() {
  const [state, setState] = useState<MapLayer | null>(null);
  return h(BaseMapLayerSelect, { state, setState });
}

export function DataTypeSelect() {
  const [state, setState] = useState<DataType | null>(null);
  return h(BaseDataTypeSelect, { state, setState });
}

export function Nullable() {
  const [state, setState] = useState<DataType | null>(null);
  return h(BaseDataTypeSelect, {
    state,
    setState(dt) {
      console.log(dt), setState(dt);
    },
    nullable: true,
  });
}

export function NotFillArea() {
  const [state, setState] = useState<DataType | null>(null);
  return h(BaseDataTypeSelect, {
    state,
    setState(dt) {
      console.log(dt), setState(dt);
    },
    nullable: true,
    fill: false,
  });
}
