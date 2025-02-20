import type { Meta, StoryFn, StoryObj } from "@storybook/react";
import h from "@macrostrat/hyper";
import { ActionDef, ActionsPreflightPanel } from ".";
import Box from "ui-box";
import { FormGroup, MenuItem, NumericInput, Spinner } from "@blueprintjs/core";
import {
  NullableSlider,
  ToasterContext,
  useToaster,
} from "@macrostrat/ui-components";
import { useState } from "react";
import { ItemSelect } from "../item-select";

export enum SelectionActionType {
  Delete = "delete",
  Heal = "heal",
  ChangeType = "changeType",
  ChangeLayer = "changeLayer",
  AdjustWidth = "adjustWidth",
  AdjustCertainty = "adjustCertainty",
  ReverseLines = "reverseLines",
  RecalculateTopology = "recalculateTopology",
}

const actions: ActionDef[] = [
  {
    id: SelectionActionType.Delete,
    name: "Delete",
    icon: "trash",
    description: "Delete selected features",
    intent: "danger",
  },
  {
    id: SelectionActionType.Heal,
    name: "Heal",
    icon: "changes",
    description: "Heal selected features",
  },
  {
    id: SelectionActionType.RecalculateTopology,
    name: "Recalculate topology",
    icon: "polygon-filter",
    description: "Recalculate the topology of selected features",
  },
  {
    id: SelectionActionType.ChangeType,
    name: "Change type",
    icon: "edit",
    detailsForm: ChangeDataTypeForm,
    isReady(state) {
      return state != null;
    },
  },
  {
    id: SelectionActionType.ChangeLayer,
    name: "Change layer",
    icon: "layers",
    detailsForm: ChangeLayerForm,
    isReady(state) {
      return state?.selectedLayerID != null;
    },
  },
  {
    id: SelectionActionType.AdjustWidth,
    name: "Adjust width",
    icon: "horizontal-distribution",
    disabled: true,
    detailsForm: AdjustWidthForm,
    defaultState: 5,
    isReady(state) {
      return state != null;
    },
  },
  {
    id: SelectionActionType.AdjustCertainty,
    name: "Adjust certainty",
    icon: "confirm",
    disabled: true,
    detailsForm: AdjustCertaintyForm,
  },
  {
    id: SelectionActionType.ReverseLines,
    name: "Reverse lines",
    icon: "swap-horizontal",
    disabled: true,
  },
];

function InstrumentedActionsPanel(props) {
  const Toaster = useToaster();
  return h(ActionsPreflightPanel, {
    onRunAction(action: ActionDef, state) {
      Toaster.show({
        message: h("div.action", [
          h("h3", action.name),
          h("pre", JSON.stringify(state, null, 2)),
        ]),
      });
    },
    ...props,
  });
}

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Form components/Actions preflight",
  component: InstrumentedActionsPanel,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
  decorators: [
    (Story: StoryFn<typeof ActionsPreflightPanel>) =>
      h(Box, { width: "450px" }, h(ToasterContext, h(Story))),
  ],
} as Meta<typeof ActionsPreflightPanel>;

export const Primary: StoryObj<typeof ActionsPreflightPanel> = {
  args: {
    actions,
  },
};

export const Compact: StoryObj<typeof ActionsPreflightPanel> = {
  args: {
    actions,
    compact: true,
  },
};

interface ChangeLayerState {
  selectedLayerID: number;
}

interface MapLayer {
  id: number;
  name: string;
}

interface DataType {
  id: string;
  name: string;
  color: string;
}

const dataTypes: DataType[] = [
  { id: "1", name: "Type 1", color: "#f00" },
  { id: "2", name: "Type 2", color: "#0f0" },
  { id: "3", name: "Type 3", color: "#00f" },
  { id: "4", name: "Type 4", color: "#ff0" },
  { id: "5", name: "Type 5", color: "#f0f" },
  { id: "6", name: "Type 6", color: "#0ff" },
  { id: "7", name: "Type 7", color: "#000" },
  { id: "8", name: "Type 8", color: "#fff" },
  { id: "9", name: "Type 9", color: "#888" },
  { id: "10", name: "Type 10", color: "#444" },
];

const defaultLayers: MapLayer[] = [
  { id: 1, name: "Layer 1" },
  { id: 2, name: "Layer 2" },
  { id: 3, name: "Layer 3" },
  { id: 4, name: "Layer 4" },
  { id: 5, name: "Layer 5" },
];

function ChangeDataTypeForm({ state, setState }) {
  return h(_DataTypeSelect, { state, setState });
}

export function MapLayerSelect() {
  const [state, setState] = useState<MapLayer | null>(null);
  return h(ItemSelect, {
    items: defaultLayers,
    selectedItem: state,
    onSelectItem: (layer) => {
      setState(layer);
    },
    label: "layer",
    icon: "layers",
  });
}

function _DataTypeSelect({ state, setState }) {
  return h(ItemSelect<DataType>, {
    items: dataTypes,
    selectedItem: state,
    onSelectItem: setState,
    label: "data type",
    icon: "tag",
    itemComponent: ({ item, ...rest }) => {
      return h(MenuItem, {
        ...rest,
        icon: h(Box, {
          is: "span",
          width: "1em",
          height: "1em",
          backgroundColor: item.color,
          borderRadius: "3px",
        }),
        text: item.name,
      });
    },
  });
}

export function DataTypeSelect() {
  const [state, setState] = useState<DataType | null>(null);
  return h(_DataTypeSelect, { state, setState });
}

function ChangeLayerForm({
  state,
  setState,
}: {
  state: ChangeLayerState | null;
  setState(state: ChangeLayerState): void;
}) {
  const layers = defaultLayers;
  const currentLayer = null;

  if (layers == null) {
    return h(Spinner);
  }

  const possibleLayers = layers.filter((d) => d.id != currentLayer);
  const selectedLayerID = state?.selectedLayerID ?? currentLayer;

  const currentLayerItem = layers.find((d) => d.id == selectedLayerID);

  return h(ItemSelect, {
    items: possibleLayers,
    selectedItem: currentLayerItem,
    onSelectItem: (layer) => {
      setState({ selectedLayerID: layer.id });
    },
    label: "layer",
    icon: "layers",
  });
}

function AdjustWidthForm({ state, setState }) {
  return h(
    FormGroup,
    { label: "Width", labelInfo: "pixels" },
    h(NumericInput, {
      min: 0,
      max: 10,
      value: state,
      majorStepSize: 1,
      minorStepSize: 0.2,
      onValueChange(value) {
        setState(Math.max(Math.min(value, 10), 0));
      },
    })
  );
}

function AdjustCertaintyForm({ state, setState }) {
  return h(
    FormGroup,
    { label: "Certainty" },
    h(NullableSlider, {
      min: 0,
      max: 10,
      value: state,
      onChange(value) {
        setState(value);
      },
    })
  );
}
