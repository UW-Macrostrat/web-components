import type { Meta, StoryFn, StoryObj } from "@storybook/react";
import h from "@macrostrat/hyper";
import { ActionCfg, ActionsPreflightPanel } from ".";
import Box from "ui-box";
import {
  FormGroup,
  Menu,
  MenuItem,
  NumericInput,
  Spinner,
} from "@blueprintjs/core";
import {
  NullableSlider,
  ToasterContext,
  useToaster,
} from "@macrostrat/ui-components";
import { Select } from "@blueprintjs/select";
import { MouseEventHandler } from "react";

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

const actions: ActionCfg[] = [
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
  { id: SelectionActionType.ChangeType, name: "Change type", icon: "edit" },
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
    onRunAction(action: ActionCfg, state) {
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

interface ChangeLayerState {
  selectedLayerID: number;
}

interface MapLayer {
  id: number;
  name: string;
}

const defaultLayers: MapLayer[] = [
  { id: 1, name: "Layer 1" },
  { id: 2, name: "Layer 2" },
  { id: 3, name: "Layer 3" },
  { id: 4, name: "Layer 4" },
  { id: 5, name: "Layer 5" },
];

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

  return h(
    Select<MapLayer>,
    {
      items: possibleLayers,
      itemRenderer: (layer, { handleClick }) => {
        return h(LayerItem, { layer, onClick: handleClick });
      },
      onItemSelect: (layer) => {
        setState({ selectedLayerID: layer.id });
      },
      popoverProps: { minimal: true, usePortal: false, matchTargetWidth: true },
      filterable: false,
      fill: true,
    },
    h(
      Menu,
      h(LayerItem, {
        className: "select-placeholder",
        layer: currentLayerItem,
        disabled: selectedLayerID == currentLayer,
      })
    )
  );
}

function LayerItem({
  selected,
  layer,
  className,
  onClick,
  disabled,
}: {
  selected?: boolean;
  layer: any;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  disabled?: boolean;
}) {
  return h(MenuItem, {
    icon: "layers",
    text: layer?.name ?? "No layer selected",
    active: selected,
    className,
    onClick,
    disabled,
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
