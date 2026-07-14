import { Button, ButtonGroup, PopoverNext, Tag } from "@blueprintjs/core";
import { useCallback, useMemo, useState } from "react";
import h from "./toolbar.module.sass";
import { TableActionContext, useSelector, useStoreAPI } from "../provider";
import {
  buildActionContext,
  getApplicableActions,
  getSelectionCardinality,
  mergeColumnActions,
} from "./selection";
import type { TableAction } from "./types";
import { RegionCardinality } from "@blueprintjs/table";
import { useToaster } from "../notifications.ts";
import { DataSheetStore } from "../provider/types.ts";
import { ColumnSpec } from "../utils";

/** A short title describing the current selection (its shape), shown as the
 * toolbar's leading label — no icon. */
function selectionTitle<T>(ctx: TableActionContext<T>): string | null {
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
      if (ctx.cell != null) {
        return "1 cell";
      }
      if (sh.columns == 1 || sh.rows == 1) {
        const nCells = Math.max(sh.columns, sh.rows);
        return `${nCells} cells`;
      }
      return `${sh.columns}×${sh.rows} cells`;
    case RegionCardinality.FULL_TABLE:
      return null;
    default:
      return null;
  }
}

/** Toolbar that renders the actions/controls applicable to the current
 * selection cardinality (modal by selection) and edit mode. Actions with a
 * `render` show their live control; others show a button (with an optional
 * `detailsForm` popover). Column-specific actions from `ColumnSpec.actions`
 * are merged when their columns are selected. A capsule on the left shows the
 * current selection polarity. */
export function ActionsToolbar<T>({
  actions,
  tableName,
  children,
}: {
  actions: TableAction<T>[];
  tableName?: string;
  children: React.ReactNode;
}) {
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
  const shownActions = applicableActions.filter(
    (action) => action.hotkey == null && (action.appliesTo?.(ctx) ?? true),
  );

  const toolbarIsShown = useMemo(
    () => hasAnyDisplayableActions(actions, columnSpec),
    [actions, columnSpec],
  );

  if (!toolbarIsShown) {
    return null;
  }

  // The toolbar is always mounted if actions are available, so it can't flicker
  // in/out as the selection or action set changes — the container is stable;
  // only its contents (title + buttons) change. Avoids layout jank.
  //
  // The leading title doubles as the clear-selection affordance: with an active
  // selection it renders as a dismissible tag (its ✕ clears the selection),
  // which ties "clear" to the selection it acts on and frees toolbar space.
  // With no selection it's a plain label (table name).
  // Both states render as a `large` `Tag` so the title keeps a constant font
  // and height; only the selected one has a filled background + a ✕ (which
  // clears the selection). The unselected label is a transparent, non-removable
  // tag — visually a plain title, but the same box.
  const hasSelection = selection != null && selection.length > 0;
  let _name = tableName ?? "Table";
  if (hasSelection) {
    _name = selectionTitle(ctx) ?? _name;
  }

  const titleNode = h(
    Tag,
    {
      key: "title",
      minimal: true,
      large: true,
      onRemove: hasSelection
        ? () =>
            storeAPI.setState({
              selection: [],
              focusedCell: null,
              topLeftCell: null,
            })
        : undefined,
      style: hasSelection ? undefined : { background: "transparent" },
    },
    _name,
  );

  // Order left→right by generality: actions that require editing
  // are "global" and sit after a spacer on the right (Save /
  // Reset); everything else is contextual and stays on the left. So the left
  // edge tracks the selection and the right edge is constant.
  const isGlobal = (a: TableAction<T>) =>
    (a.targets.includes(RegionCardinality.FULL_TABLE) ||
      a.targets.includes("none" as any)) &&
    a.requiresEditable;
  const contextual = shownActions.filter((a) => !isGlobal(a));
  // Order the built-in global actions least→most impactful, left→right: reset
  // changes, then save. Any other global actions keep their natural order to
  // the left of these (stable sort, rank 0).

  const globalActions = shownActions.filter(isGlobal);

  return h("div.actions-toolbar", [
    titleNode,
    h(
      ButtonGroup,
      { key: "contextual", minimal: true },
      contextual.map((action) =>
        h(ActionButton, { key: action.id, action, ctx }),
      ),
    ),
    children,
    h("div.toolbar-spacer", { key: "spacer", style: { flex: 1 } }),
    h(
      ButtonGroup,
      { key: "global", minimal: true },
      globalActions.map((action) =>
        h(ActionButton, { key: action.id, action, ctx }),
      ),
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

function hasAnyDisplayableActions(
  actions: TableAction[],
  columnSpec: ColumnSpec[],
) {
  /** Check whether there are any actions that can be displayed in the toolbar.
   * for the entire table. This is used to determine whether the toolbar should
   * be rendered. If any actions are available, the toolbar is rendered in ALL
   * selection modes to avoid flickering
   */
  const allActions = [
    ...actions,
    ...columnSpec.flatMap((c) => c.actions ?? []),
  ];

  if (allActions.length === 0) {
    return false;
  }
  // Check whether any action doesn't have hotkey and is not disabled
  return allActions.some(
    (action) => action.hotkey == null && !isActionDisabled(action, {}),
  );
}
