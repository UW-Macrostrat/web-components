import type { Meta, StoryFn, StoryObj } from "@storybook/react";
import h from "@macrostrat/hyper";
import { ActionCfg, ActionsPreflightPanel, ChangeLayerForm } from ".";
import Box from "ui-box";

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
  },
  {
    id: SelectionActionType.AdjustWidth,
    name: "Adjust width",
    icon: "horizontal-distribution",
    disabled: true,
  },
  {
    id: SelectionActionType.AdjustCertainty,
    name: "Adjust certainty",
    icon: "confirm",
    disabled: true,
  },
  {
    id: SelectionActionType.ReverseLines,
    name: "Reverse lines",
    icon: "swap-horizontal",
    disabled: true,
  },
];

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Form components/Actions preflight",
  component: ActionsPreflightPanel,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
  decorators: [
    (Story: StoryFn<typeof ActionsPreflightPanel>) =>
      h(Box, { width: "450px" }, h(Story)),
  ],
} as Meta<typeof ActionsPreflightPanel>;

export const Primary: StoryObj<typeof ActionsPreflightPanel> = {
  args: {
    actions,
  },
};
