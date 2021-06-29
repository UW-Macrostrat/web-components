import JSONTree from "react-json-tree";
import h, { classed } from "@macrostrat/hyper";

const _JSONView = classed(JSONTree, "json-tree");

export function JSONView(props) {
  return h(_JSONView, props);
}
