import { Button, ButtonGroup, PopoverNext } from "@blueprintjs/core";
import { useCallback, useMemo, useState } from "react";
import h from "./toolbar.module.sass";
import { useSelector, useStoreAPI } from "../provider";
import {
  buildActionContext,
  getApplicableActions,
  getSelectionCardinality,
} from "./selection";
import type { TableAction } from "./types";

/** Toolbar that renders applicable table actions based on the
 * current selection cardinality and edit mode. */
export function ActionsToolbar<T>({
  actions,
}: {
  actions: TableAction<T>[];
}) {
  const selection = useSelector((state) => state.selection);
  const editable = useSelector((state) => state.editable);

  const cardinality = useMemo(
    () => getSelectionCardinality(selection),
    [selection],
  );

  const applicableActions = useMemo(
    () => getApplicableActions(actions, cardinality, editable),
    [actions, cardinality, editable],
  );

  if (applicableActions.length === 0) return null;

  return h(
    "div.actions-toolbar",
    h(
      ButtonGroup,
      { minimal: true },
      applicableActions.map((action) =>
        h(ActionButton, { key: action.id, action }),
      ),
    ),
  );
}

/** A single action button. Handles both simple actions (direct click)
 * and actions with a `detailsForm` (popover with config + run). */
function ActionButton<T>({ action }: { action: TableAction<T> }) {
  const storeAPI = useStoreAPI();

  // Reactive disabled check — re-renders when relevant state changes
  const isDisabled = useSelector((state) => {
    if (typeof action.disabled === "boolean") return action.disabled;
    if (typeof action.disabled === "function") {
      return action.disabled(buildActionContext(state));
    }
    return false;
  });

  const runAction = useCallback(
    (configState?: any) => {
      const ctx = buildActionContext(storeAPI.getState());
      action.run(ctx, configState);
    },
    [storeAPI, action],
  );

  if (action.detailsForm != null) {
    return h(ActionButtonWithForm, { action, runAction, isDisabled });
  }

  return h(
    Button,
    {
      icon: action.icon,
      intent: action.intent,
      disabled: isDisabled,
      onClick() {
        runAction();
      },
    },
    action.name,
  );
}

/** Action button that opens a popover for pre-run configuration. */
function ActionButtonWithForm<T, S>({
  action,
  runAction,
  isDisabled,
}: {
  action: TableAction<T, S>;
  runAction: (configState?: S) => void;
  isDisabled: boolean;
}) {
  const [configState, setConfigState] = useState<S>(
    action.defaultState ?? (null as S),
  );
  const [isOpen, setIsOpen] = useState(false);

  let ready = true;
  if (action.isReady != null) {
    ready = action.isReady(configState);
  }

  return h(
    PopoverNext,
    {
      isOpen,
      onClose: () => setIsOpen(false),
      content: h("div.action-popover-content", [
        h.if(action.description != null)("p.description", action.description),
        h(action.detailsForm, {
          state: configState,
          setState: setConfigState,
        }),
        h(
          Button,
          {
            className: "run-button",
            intent: action.intent ?? "primary",
            icon: "play",
            disabled: !ready,
            fill: true,
            onClick() {
              runAction(configState);
              setIsOpen(false);
            },
          },
          "Run",
        ),
      ]),
      placement: "bottom-start",
      enforceFocus: false,
      autoFocus: false,
    },
    h(
      Button,
      {
        icon: action.icon,
        intent: action.intent,
        disabled: isDisabled,
        onClick: () => setIsOpen(!isOpen),
      },
      action.name,
    ),
  );
}

