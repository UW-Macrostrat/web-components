import hyper from "@macrostrat/hyper";
import style from "./actions.module.sass";
const h = hyper.styled(style);

export function DataSheetActionsRow(props) {
  return h("div.table-actions", props.children);
}

export function DataSheetAction(props) {
  return h("div.table-action", props.children);
}
