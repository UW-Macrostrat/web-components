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

/** A short title describing the current selection (its shape), shown as the
 * toolbar's leading label — no icon. */
function selectionTitle<T>(ctx: TableActionContext<T>): string {
  const sh = ctx.selectionShape;
  switch (sh.cardinality) {
    case RegionCardinality.FULL_COLUMNS: {
      if (ctx.columnKey != null) {
        const col = ctx.columnSpec.find((c) => c.key === ctx.columnKey);
        return col?.name ?? "Column";
      }
      return `${sh.columns} columns`;
    }
    case RegionCardinality.FULL_ROWS:
      return ctx.rowIndex != null ? "1 row" : `${sh.rows} rows`;
    case RegionCardinality.CELLS:
      return ctx.cell != null ? "Cell" : `${sh.columns}×${sh.rows} cells`;
    case RegionCardinality.FULL_TABLE:
      return "Table";
    default:
      return "";
  }
}

/** Toolbar that renders the actions/controls applicable to the current
 * selection cardinality (modal by selection) and edit mode. Actions with a
 * `render` show their live control; others show a button (with an optional
 * `detailsForm` popover). Column-specific actions from `ColumnSpec.actions`
 * are merged when their columns are selected. A capsule on the left shows the
 * current selection polarity. */
export function ActionsToolbar<T>({ actions }: { actions: TableAction<T>[] }) {
  const selection = useSelector((state) => state.selection);
  const editable = useSelector((state) => state.editable);
  const columnSpec = useSelector((state) => state.columnSpec);
  const storeAPI = useStoreAPI();

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

  const hasSelection = selection.length > 0;

  // Context for `render`-style controls (they subscribe to the store
  // themselves; this resolves the selected column/rows).
  const ctx = buildActionContext(
    storeAPI.getState(),
    storeAPI.setState,
  ) as TableActionContext<T>;

  // The toolbar is for actions that AREN'T keyboard-accessible: any action
  // with a `hotkey` (copy/cut/paste, etc.) is reachable from the keyboard and
  // is omitted here (it still works via its shortcut). Then refine by selection
  // shape beyond cardinality (e.g. single column only).
  const shown = applicableActions.filter(
    (action) => action.hotkey == null && (action.appliesTo?.(ctx) ?? true),
  );

  // The toolbar is always mounted (never returns null) so it can't flicker
  // in/out as the selection or action set changes — the container is stable;
  // only its contents (title + buttons) change. Avoids layout jank.
  const title = selectionTitle(ctx);

  return h("div.actions-toolbar", [
    hasSelection && title
      ? h("span.toolbar-title", { key: "title" }, title)
      : null,
    h(
      ButtonGroup,
      { key: "actions", minimal: true },
      shown.map((action) => h(ActionButton, { key: action.id, action, ctx })),
    ),
  ]);
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
    const res = action.run?.(ctx, configState);
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

/** Dispatcher: a live control (`action.render`) or a run/detailsForm button.
 * Kept hook-free so the two paths don't share a hook order. */
function ActionButton<T>({
  action,
  ctx,
}: {
  action: TableAction<T>;
  ctx: TableActionContext<T>;
}) {
  if (action.render != null) {
    return action.render(ctx) as any;
  }
  return h(RunActionButton, { action });
}

/** A run/detailsForm action rendered as a button. */
function RunActionButton<T>({ action }: { action: TableAction<T> }) {
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
