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

import { Select } from "@blueprintjs/select";
import { MouseEventHandler, useState } from "react";

const h = hyper.styled(styles);

export type ActionCfg = {
  name: string;
  icon: IconName;
  id: any;
  description?: string;
  intent?: Intent;
  detailsForm?: React.ComponentType<{ state: any; updateState: any }>;
  disabled?: boolean;
  isReady?: (state: any) => boolean;
};

export function ActionsPreflightPanel({ actions }) {
  // test vvv
  const [action, setAction] = useState(null);

  return h("div.selection-actions", [
    h(
      Menu,
      { className: "actions-list" },
      actions.map((d) => {
        const isSelected = action?.id == d.id;
        return h(MenuItem, {
          icon: d.icon,
          active: isSelected,
          intent: isSelected ? "primary" : "none",
          onClick() {
            setAction((selected) => {
              return d.id == selected?.id ? null : d;
            });
          },
          text: d.name,
        });
      })
    ),
    h(ActionDetailsPanel, { actions, action }),
  ]);
}

function ActionDetailsPanel({
  actions,
  action,
}: {
  action: object | null;
  actions: any;
}) {
  let title = "No action selected";
  const actionCfg = actions.find((d) => d.id == action?.id);
  if (action != null) {
    title = actionCfg?.name ?? "Unknown action";
  }

  let content: any = h(NonIdealState, {
    icon: "flows",
  });
  title = actionCfg?.name ?? "No action selected";

  if (action != null && actionCfg != null) {
    content = h(ActionDetailsContent, {
      action: actionCfg,
      state: action?.state,
    });
  }

  return h("div.action-details", [h("h2", title), content]);
}

function ActionDetailsContent({ action }: { action: ActionCfg }) {
  const { description, intent = "primary", detailsForm } = action;

  //const updateState = useMapActions((state) => state.setSelectionActionState);

  const [state, updateState] = useState(null);

  let disabled = false;
  if (action.isReady != null) {
    disabled = !action.isReady(state);
  }

  return h("div.action-details-content", [
    h.if(description != null)("p", description),
    h.if(detailsForm != null)(detailsForm, { state, updateState }),
    h("div.spacer"),
    h(Button, { intent, icon: "play", disabled }, "Run"),
  ]);
}

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

export function ChangeLayerForm({
  state,
  updateState,
}: {
  state: ChangeLayerState | null;
  updateState(state: ChangeLayerState): void;
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
        updateState({ selectedLayerID: layer.id });
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
