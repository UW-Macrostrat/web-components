import h from "./actions.module.sass";

export function DataSheetActionsRow(props) {
  return h("div.table-actions", props.children);
}

export function DataSheetAction(props) {
  return h("div.table-action", props.children);
}
