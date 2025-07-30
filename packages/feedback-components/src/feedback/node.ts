import { NodeApi, TreeApi } from "react-arborist";
import { TreeData } from "./types";
import { EntityTag } from "../extractions";
import { useTreeDispatch } from "./edit-state";
import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";

const h = hyper.styled(styles);

function isSelected(searchNode: TreeData, treeNode: TreeData) {
  return searchNode.id == treeNode.id;
  // We could also select children of the search node here if we wanted to
}

function isNodeHighlighted(node: NodeApi<TreeData>, tree: TreeApi<TreeData>) {
  // We treat no selection as all nodes being active. We may add some nuance later
  if (tree.selectedNodes.length == 0) {
    return true;
  }

  for (const selectedNode of tree.selectedNodes) {
    if (isSelected(node.data, selectedNode.data)) {
      return true;
    }
  }

  // Check if the parent node is highlighted
  if (node.parent != null && isNodeHighlighted(node.parent, tree)) {
    return true;
  }

  return false;
}

function isNodeActive(node: NodeApi<TreeData>, tree: TreeApi<TreeData>) {
  for (const selectedNode of tree.selectedNodes) {
    if (isSelected(node.data, selectedNode.data)) {
      return true;
    }
  }
  return false;
}

function Node({
  node,
  style,
  dragHandle,
  tree,
  matchComponent,
  viewOnly,
}: any) {
  let highlighted: boolean = isNodeHighlighted(node, tree);
  let active: boolean = isNodeActive(node, tree);

  console.log("viewOnly", viewOnly);

  const dispatch = useTreeDispatch();

  if (!node.data?.type) {
    node.data.type = { name: "lith", color: "rgb(107, 255, 91)" };
  }

  return h(
    "div.node" + (!viewOnly ? ".clickable" : ""),
    { style, ref: dragHandle },
    h(EntityTag, {
      data: node.data,
      active: viewOnly ? false : active,
      highlighted: viewOnly ? true : highlighted,
      matchComponent,
      onClickType() {
        dispatch({ type: "toggle-entity-type-selector" });
      },
    }),
  );
}

export default Node;
