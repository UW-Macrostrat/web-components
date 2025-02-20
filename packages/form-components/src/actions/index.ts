import hyper from "@macrostrat/hyper";
import styles from "./index.module.scss";
import {
  Button,
  IconName,
  Intent,
  Menu,
  MenuItem,
  NonIdealState,
  Spinner,
} from "@blueprintjs/core";
import { ComponentType, MouseEventHandler, ReactNode, useState } from "react";
import { Select } from "@blueprintjs/select";

const h = hyper.styled(styles);

export type ActionCfg = {
  name: string;
  icon: IconName;
  id: any;
  description?: string;
  intent?: Intent;
  detailsForm?: ComponentType<{ state: any; setState: any }>;
  disabled?: boolean;
  isReady?: (state: any) => boolean;
};

export function ActionsPreflightPanel({ actions, onRunAction }) {
  // test vvv
  const [selectedAction, setSelectedAction] = useState(null);
  const [state, setState] = useState<Record<string, any>>({});

  const actionState = selectedAction != null ? state[selectedAction.id] : null;

  const title = selectedAction?.name ?? "No action selected";
  let content: ReactNode = h(NonIdealState, { icon: "flows" });
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
        return h(MenuItem, {
          icon: d.icon,
          active: isSelected,
          intent: isSelected ? "primary" : "none",
          onClick() {
            setSelectedAction(d.id == selectedAction?.id ? null : d);
          },
          text: d.name,
        });
      })
    ),
    h(ActionFrame, { title }, content),
  ]);
}

function ActionFrame({ title, children }) {
  return h("div.action-details", [
    h("h2", title),
    h("div.action-details-content", children),
  ]);
}

function ActionDetailsContent({
  action,
  state,
  onRunAction,
  setState,
}: {
  action: ActionCfg;
  state: any;
  setState(state: any): void;
  onRunAction(action: ActionCfg, state: any): void;
}) {
  const { description, intent = "primary", detailsForm } = action;

  let disabled = false;
  if (action.isReady != null) {
    disabled = !action.isReady(state);
  }

  return h("div.action-details-content", [
    h.if(description != null)("p", description),
    h.if(detailsForm != null)(detailsForm, { state, setState }),
    h("div.spacer"),
    h(
      Button,
      {
        intent,
        icon: "play",
        disabled,
        onClick() {
          onRunAction(action, state);
        },
      },
      "Run"
    ),
  ]);
}

function singularReferent(label: string) {
  let n = "";
  for (let v of ["a", "e", "i", "o", "u"]) {
    if (label.startsWith(v)) {
      n = "n";
      break;
    }
  }
  return `a${n} ${label}`;
}

/** A generic select component for selecting an item from a list */
export function ItemSelect<T extends Nameable>({
  items,
  selectedItem,
  onSelectItem,
  label = "item",
  icon = null,
  itemComponent = DefaultItemComponent,
}: {
  items: T[] | null;
  selectedItem: T | null;
  onSelectItem(item: T): void;
  label: string;
  icon: IconName | ReactNode | null;
  itemComponent?: ComponentType<ItemComponentProps<T>>;
}) {
  let placeholder = `Select ${singularReferent(label)}`;
  let _icon: IconName | ReactNode = icon;
  if (items == null) {
    _icon = h(Spinner);
    placeholder = "Loading...";
  }
  let content: ReactNode = h(MenuItem, {
    icon: _icon,
    text: placeholder,
    disabled: true,
  });
  if (selectedItem != null) {
    content = h(itemComponent, {
      item: selectedItem,
      icon,
    });
  }

  return h(
    Select<T>,
    {
      items: items ?? [],
      itemRenderer: (item, { handleClick }) => {
        return h(itemComponent, { item, onClick: handleClick, icon });
      },
      onItemSelect: onSelectItem,
      popoverProps: { minimal: true, usePortal: false, matchTargetWidth: true },
      filterable: false,
      fill: true,
    },
    h(Menu, content)
  );
}

interface Nameable {
  name: string;
  icon?: IconName | ReactNode;
}

interface ItemComponentProps<T> {
  item: T;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  icon?: IconName | ReactNode;
}

function DefaultItemComponent<T extends Nameable>({
  item,
  className,
  onClick,
  icon,
}: {
  item: T;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
}) {
  return h(MenuItem, {
    icon: item.icon ?? icon,
    text: item.name,
    className,
    onClick,
  });
}
