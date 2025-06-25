import type { Meta, StoryFn, StoryObj } from "@storybook/react-vite";
import h from "@macrostrat/hyper";
import { ActionDef, ActionsPreflightPanel } from ".";
import Box from "ui-box";
import { FormGroup, NumericInput, Spinner } from "@blueprintjs/core";
import {
  NullableSlider,
  ToasterContext,
  useToaster,
} from "@macrostrat/ui-components";
import {
  BaseDataTypeSelect,
  exampleMapLayers,
  MapLayer,
} from "../item-select/examples";
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

type MapboardActionDef =
  | ActionDef<SelectionActionType.Delete>
  | ActionDef<SelectionActionType.Heal>
  | ActionDef<SelectionActionType.RecalculateTopology>
  | ActionDef<SelectionActionType.ChangeType, string>
  | ActionDef<SelectionActionType.ChangeLayer, ChangeLayerState>
  | ActionDef<SelectionActionType.AdjustWidth, number>
  | ActionDef<SelectionActionType.AdjustCertainty, number | null>
  | ActionDef<SelectionActionType.ReverseLines>;

const actions: MapboardActionDef[] = [
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

function ChangeDataTypeForm({ state, setState }) {
  return h(BaseDataTypeSelect, { state, setState });
}

function ChangeLayerForm({
  state,
  setState,
}: {
  state: ChangeLayerState | null;
  setState(state: ChangeLayerState): void;
}) {
  const layers = exampleMapLayers;
  const currentLayer = null;

  const selectedLayerID = state?.selectedLayerID ?? currentLayer;
  const possibleLayers = layers.filter((d) => d.id != selectedLayerID);
  const currentLayerItem = layers.find((d) => d.id == selectedLayerID);

  return h(ItemSelect<MapLayer>, {
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
