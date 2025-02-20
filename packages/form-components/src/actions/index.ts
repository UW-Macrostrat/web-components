import hyper from "@macrostrat/hyper";
import styles from "./index.module.scss";
import {
  Button,
  Card,
  IconName,
  Intent,
  Menu,
  MenuItem,
  NonIdealState,
} from "@blueprintjs/core";
import { ComponentType, ReactNode, useState } from "react";

const h = hyper.styled(styles);

export type ActionDef = {
  name: string;
  icon: IconName;
  id: string;
  description?: string;
  intent?: Intent;
  defaultState?: any;
  detailsForm?: ComponentType<{ state: any; setState: any }>;
  disabled?: boolean;
  isReady?: (state: any) => boolean;
};

export function ActionsPreflightPanel({ actions, onRunAction }) {
  // test vvv
  const [selectedAction, setSelectedAction] = useState(null);
  const [state, setState] = useState<Record<string, any>>({});

  let actionState = null;
  if (selectedAction != null) {
    actionState = state[selectedAction.id] ?? selectedAction.defaultState;
  }

  const title = selectedAction?.name ?? "No action selected";
  let content: ReactNode = h(NonIdealState, {
    title: "No action selected",
    icon: "flows",
  });
  if (selectedAction != null) {
    content = h(ActionDetailsContent, {
      action: selectedAction,
      state: actionState,
      setState(state) {
        setState({ ...state, [selectedAction.id]: state });
      },
      onRunAction,
    });
  }

  return h("div.selection-actions", [
    h(
      Menu,
      { className: "actions-list" },
      actions.map((d) => {
        const isSelected = selectedAction?.id == d.id;
        const intent: Intent = d.intent ?? "primary";
        return h(MenuItem, {
          icon: d.icon,
          active: isSelected,
          disabled: d.disabled,
          intent: isSelected ? intent : "none",
          onClick() {
            setSelectedAction(d.id == selectedAction?.id ? null : d);
          },
          text: d.name,
        });
      })
    ),
    h("div.action-details", content),
  ]);
}

function ActionDetailsContent({
  action,
  state,
  onRunAction,
  setState,
}: {
  action: ActionDef;
  state: any;
  setState(state: any): void;
  onRunAction(action: ActionDef, state: any): void;
}) {
  const { description, intent = "primary", detailsForm } = action;

  let disabled = false;
  if (action.isReady != null) {
    disabled = !action.isReady(state);
  }

  return h("div.action-details-content", [
    h(
      Button,
      {
        intent,
        rightIcon: "play",
        disabled,
        large: true,
        className: "action-button",
        onClick() {
          onRunAction(action, state);
        },
      },
      action.name
    ),
    h.if(description != null)("p.description", description),
    h.if(detailsForm != null)(detailsForm, { state, setState }),
    h("div.spacer"),
  ]);
}
