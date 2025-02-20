import hyper from "@macrostrat/hyper";
import styles from "./index.module.scss";
import {
  Button,
  Card,
  Icon,
  IconName,
  Intent,
  Menu,
  MenuItem,
  NonIdealState,
} from "@blueprintjs/core";
import { ComponentType, ReactNode, useState } from "react";
import classNames from "classnames";
import { ItemSelect } from "@macrostrat/form-components";

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

export function ActionsPreflightPanel({
  actions,
  onRunAction,
  compact = false,
}) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [state, updateState] = useState<Record<string, any>>({});

  let actionState = null;
  if (selectedAction != null) {
    actionState = state[selectedAction.id] ?? selectedAction.defaultState;
  }

  let content: ReactNode = h(NonIdealState, {
    title: "No action selected",
    icon: "flows",
  });
  if (selectedAction != null) {
    content = h(ActionDetailsContent, {
      action: selectedAction,
      state: actionState,
      setState(state) {
        updateState({ ...state, [selectedAction.id]: state });
      },
      onRunAction,
      compact,
    });
  }

  return h("div.actions-preflight", { className: classNames({ compact }) }, [
    h("div.actions-list", [
      h(ActionsList, {
        actions,
        selectedAction,
        onSelectAction: setSelectedAction,
        compact,
      }),
    ]),
    content,
  ]);
}

function ActionsList({
  actions,
  selectedAction,
  onSelectAction,
  compact = false,
}) {
  if (compact) {
    return h(ItemSelect<ActionDef>, {
      items: actions,
      onSelectItem(item) {
        onSelectAction(item);
      },
      icon: "flows",
      selectedItem: selectedAction,
      label: "action",
      itemComponent: ItemRenderer,
    });
  }

  return h(
    Menu,
    actions.map((item) => {
      const isSelected = selectedAction?.id == item.id;
      return h(ItemRenderer, {
        item,
        isSelected,
        onClick() {
          onSelectAction(item.id == selectedAction?.id ? null : item);
        },
      });
    })
  );
}

function ItemRenderer({ item, onClick, isSelected }) {
  const intent: Intent = item.intent ?? "primary";
  return h(MenuItem, {
    icon: item.icon,
    active: isSelected,
    disabled: item.disabled,
    intent,
    onClick,
    text: item.name,
  });
}

function ActionDetailsContent({
  action,
  state,
  onRunAction,
  setState,
  compact = false,
}: {
  action: ActionDef;
  state: any;
  setState(state: any): void;
  onRunAction(action: ActionDef, state: any): void;
  compact?: boolean;
}) {
  const { description, icon, intent = "primary", detailsForm } = action;

  let leftItem = null;
  if (icon != null) {
    if (typeof icon === "string") {
      leftItem = h(Icon, { icon, size: 20 });
    } else {
      leftItem = icon;
    }
  }

  let disabled = false;
  if (action.isReady != null) {
    disabled = !action.isReady(state);
  }

  return h([
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
    // h.if(!compact)(FlexRow, { gap: "1.2em", alignItems: "center" }, [
    //   leftItem,
    //   h("h3", action.name),
    // ]),
    h("div.action-details", [
      h.if(description != null)("p.description", description),
      h.if(detailsForm != null)(detailsForm, { state, setState }),
      h("div.spacer"),
    ]),
  ]);
}
