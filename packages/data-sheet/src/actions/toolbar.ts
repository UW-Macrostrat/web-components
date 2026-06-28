import { Button, ButtonGroup, PopoverNext } from "@blueprintjs/core";
import { useCallback, useMemo, useState } from "react";
import h from "./toolbar.module.sass";
import { useSelector, useStoreAPI } from "../provider";
import {
  buildActionContext,
  getApplicableActions,
  getSelectionCardinality,
  mergeColumnActions,
} from "./selection";
import type { TableAction, TableActionContext } from "./types";
import { RegionCardinality } from "@blueprintjs/table";
import { useToaster } from "../notifications.ts";
import { DataSheetStore } from "../types.ts";

/** Toolbar that renders applicable table actions based on the
 * current selection cardinality and edit mode.
 * Automatically merges column-specific actions from `ColumnSpec.actions`
 * when the corresponding columns are in the selection. */
export function ActionsToolbar<T>({ actions }: { actions: TableAction<T>[] }) {
  const selection = useSelector((state) => state.selection);
  const editable = useSelector((state) => state.editable);
  const columnSpec = useSelector((state) => state.columnSpec);

  const cardinality = useMemo(
    () => getSelectionCardinality(selection) ?? RegionCardinality.FULL_TABLE,
    [selection],
  );

  // Merge global actions with column-specific actions from the selection
  const allActions = useMemo(
    () => mergeColumnActions(actions, columnSpec, selection),
    [actions, columnSpec, selection],
  );

  const applicableActions = useMemo(
    () => getApplicableActions(allActions, cardinality, editable),
    [allActions, cardinality, editable],
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

function getMessageForError(e: any) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (e instanceof Object) return JSON.stringify(e);
  return null;
}

function isActionDisabled(action: TableAction, state: any): boolean {
  if (typeof action.disabled === "boolean") return action.disabled;
  if (typeof action.disabled === "function") {
    return action.disabled(state);
  }
  return false;
}

export function runActionWrapper<T>(
  action: TableAction<T>,
  state: DataSheetStore<any>,
  setState: (state: Partial<DataSheetStore<any>>) => void,
  toaster: any,
  configState: any = undefined,
) {
  const ctx = buildActionContext(state, setState) as TableActionContext<T>;
  if (action.disabled instanceof Function) {
    if (action.disabled(ctx)) {
      return;
    }
  } else if (action.disabled) {
    return;
  }
  try {
    const res = action.run(ctx, configState);
    if (res instanceof Promise) {
      res
        .then(() => {})
        .catch((e) => {
          displayErrorForAction(action, e, toaster);
        });
    }
  } catch (e) {
    displayErrorForAction(action, e, toaster);
  }
}

/** A single action button. Handles both simple actions (direct click)
 * and actions with a `detailsForm` (popover with config + run). */
function ActionButton<T>({ action }: { action: TableAction<T> }) {
  const storeAPI = useStoreAPI();
  const toaster = useToaster();

  // Reactive disabled check — re-renders when relevant state changes
  const isDisabled = useSelector((state) => {
    return isActionDisabled(action, state);
  });

  const runAction = useCallback(
    (configState?: any) => {
      runActionWrapper(
        action,
        storeAPI.getState(),
        storeAPI.setState,
        toaster,
        configState,
      );
    },
    [storeAPI, action, toaster],
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

function displayErrorForAction(action: TableAction, error: any, toaster: any) {
  const message =
    getMessageForError(error) ?? action.errorMessage ?? "Action failed";
  toaster.show({
    message,
    intent: "danger",
  });
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
