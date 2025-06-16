import { TreeData } from "./types";
import { createContext, Dispatch, useContext, useReducer } from "react";
import update, { Spec } from "immutability-helper";
import { EntityType } from "../extractions/types";

export enum ViewMode {
  Tree = "tree",
  Graph = "graph",
}

interface TreeState {
  initialTree: TreeData[];
  tree: TreeData[];
  selectedNodes: number[];
  entityTypesMap: Map<number, EntityType>;
  selectedEntityType: EntityType;
  lastInternalId: number;
  isSelectingEntityType: boolean;
  viewMode: ViewMode;
}

type TextRange = {
  start: number;
  end: number;
  text: string;
};

type TreeAction =
  | {
      type: "move-node";
      payload: { dragIds: number[]; parentId: number; index: number };
    }
  | { type: "delete-node"; payload: { ids: number[] } }
  | { type: "select-node"; payload: { ids: number[] } }
  | { type: "toggle-node-selected"; payload: { ids: number[] } }
  | { type: "set-view-mode"; payload: ViewMode }
  | { type: "create-node"; payload: TextRange }
  | { type: "select-entity-type"; payload: EntityType }
  | { type: "toggle-entity-type-selector"; payload?: boolean | null }
  | { type: "deselect" }
  | { type: "reset" };

export type TreeDispatch = Dispatch<TreeAction>;

export function useUpdatableTree(
  initialTree: TreeData[],
  entityTypes: Map<number, EntityType>
): [TreeState, TreeDispatch] {
  // Get the first entity type
  // issue: grabs second entity instead of selected one
  const type = entityTypes.values().next().value;

  return useReducer(treeReducer, {
    initialTree,
    tree: initialTree,
    selectedNodes: [],
    entityTypesMap: entityTypes,
    selectedEntityType: type,
    lastInternalId: 0,
    isSelectingEntityType: false,
    viewMode: ViewMode.Tree,
  });
}

export const TreeDispatchContext = createContext<TreeDispatch | null>(null);

export function useTreeDispatch() {
  const dispatch = useContext(TreeDispatchContext);
  if (dispatch == null) {
    throw new Error("No dispatch context available");
  }
  return dispatch;
}

function treeReducer(state: TreeState, action: TreeAction) {
  switch (action.type) {
    case "move-node":
      // For each node in the tree, if the node is in the dragIds, remove it from the tree and collect it
      const [newTree, removedNodes] = removeNodes(
        state.tree,
        action.payload.dragIds
      );

      let keyPath: (number | "children")[] = [];
      if (action.payload.parentId) {
        keyPath = findNode(newTree, action.payload.parentId);
        keyPath.push("children");
      }

      // Add removed nodes to the new tree at the correct location
      let updateSpec = buildNestedSpec(keyPath, {
        $splice: [[action.payload.index, 0, ...removedNodes]],
      });

      return { ...state, tree: update(newTree, updateSpec) };
    case "delete-node":
      // For each node in the tree, if the node is in the ids, remove it from the tree
      const [newTree2, _removedNodes] = removeNodes(
        state.tree,
        action.payload.ids
      );
      // Get children of the removed nodes
      // If children are not present elsewhere in the tree, insert them

      const children = _removedNodes
        .flatMap((node) => node.children ?? [])
        .filter((child) => !nodeIsInTree(newTree2, child.id));

      // Reset the selection

      return {
        ...state,
        tree: [...newTree2, ...children],
        selectedNodes: state.selectedNodes.filter(
          (id) => !action.payload.ids.includes(id)
        ),
      };
    case "select-node":
      const { ids } = action.payload;

      const type = action.payload.ids.length > 0
        ? findNodeById(state.tree, ids[0])?.type
        : null;
      
      return { ...state, selectedNodes: ids, selectedEntityType: type };
    // otherwise fall through to toggle-node-selected for a single ID
    case "toggle-node-selected":
      const nodesToAdd = action.payload.ids.filter(
        (id) => !state.selectedNodes.includes(id)
      );
      const nodesToKeep = state.selectedNodes.filter(
        (id) => !action.payload.ids.includes(id)
      );
      return { ...state, selectedNodes: [...nodesToKeep, ...nodesToAdd] };

    case "create-node":
      const newId = state.lastInternalId - 1;
      const { text, start, end } = action.payload;
      const node: TreeData = {
        id: newId,
        name: text,
        children: [],
        indices: [start, end],
        type: state.selectedEntityType,
      };

      return {
        ...state,
        tree: [...state.tree, node],
        selectedNodes: [newId],
        lastInternalId: newId,
      };

    /** Entity type selection */
    case "toggle-entity-type-selector":
      return {
        ...state,
        isSelectingEntityType: action.payload ?? !state.isSelectingEntityType,
      };
    case "select-entity-type": {
      // For each selected node, update the type
      let newTree2 = state.tree;
      for (let id of state.selectedNodes) {
        const keyPath = findNode(state.tree, id);
        const nestedSpec = buildNestedSpec(keyPath, {
          type: { $set: action.payload },
        });
        newTree2 = update(newTree2, nestedSpec);
      }

      return {
        ...state,
        tree: newTree2,
        selectedEntityType: action.payload,
      };
    }
    case "deselect":
      return { ...state, selectedNodes: [] };
    case "reset":
      return {
        ...state,
        tree: state.initialTree,
        selectedNodes: [],
      };
    case "set-view-mode":
      return { ...state, viewMode: action.payload };
  }
}

function nodeIsInTree(tree: TreeData[], id: number): boolean {
  for (let node of tree) {
    if (node.id == id) {
      return true;
    } else if (node.children) {
      if (nodeIsInTree(node.children, id)) {
        return true;
      }
    }
  }
  return false;
}

function buildNestedSpec(
  keyPath: (number | "children")[],
  innerSpec: Spec<any>
): Spec<TreeData[]> {
  // Build a nested object from a key path

  let spec = innerSpec;
  for (let i = keyPath.length - 1; i >= 0; i--) {
    spec = { [keyPath[i]]: spec };
  }
  return spec as any;
  // Since we don't have a "children" key at the root, we make the top-level spec an array
}

function findNode(
  tree: TreeData[],
  id: number
): (number | "children")[] | null {
  // Find the index of the node with the given id in the tree, returning the key path
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id == id) {
      return [i];
    } else if (tree[i].children) {
      let path = findNode(tree[i].children, id);
      if (path != null) {
        return [i, "children", ...path];
      }
    }
  }
  return null;
}

function removeNodes(
  tree: TreeData[],
  ids: number[]
): [TreeData[], TreeData[]] {
  /** Remove nodes with the given ids from the tree and return the new tree and the removed nodes */
  let newTree: TreeData[] = [];
  let removedNodes: TreeData[] = [];

  for (let node of tree) {
    if (ids.includes(node.id)) {
      removedNodes.push(node);
    } else {
      // Recurse into children
      if (node.children) {
        let [newChildren, removedChildren] = removeNodes(node.children, ids);
        node = { ...node, children: newChildren };
        removedNodes.push(...removedChildren);
      }
      newTree.push(node);
    }
  }

  return [newTree, removedNodes];
}

export interface EntityOutput {
  id: number;
  type: number | null;
  txt_range: number[][];
  name: string;
  match: any | null;
  reasoning: string | null;
  color: string | null;
  children: any[] | null;
}

export interface GraphData {
  nodes: EntityOutput[];
  edges: { source: number; dest: number }[];
}

export function treeToGraph(tree: TreeData[]): GraphData {
  // Convert the tree to a graph
  let nodes: EntityOutput[] = [];
  let edges: { source: number; dest: number }[] = [];
  const nodeMap = new Map<number, TreeData>();

  for (let node of tree) {
    // If we've already found an instance of this node, we don't need to record
    // it again
    if (nodeMap.has(node.id)) {
      continue;
    }

    const { indices, id, name, type, children } = node;

    const nodeData: EntityOutput = {
      id,
      type: type.id,
      color: type.color,
      name,
      txt_range: [indices],
      reasoning: null,
      match: node.match,
      children
    };

    nodeMap.set(node.id, node);
    nodes.push(nodeData);

    if (node.children) {
      for (let child of node.children) {
        edges.push({ source: node.id, dest: child.id });
      }

      // Now process the children
      const { nodes: childNodes, edges: childEdges } = treeToGraph(
        node.children
      );
      nodes.push(...childNodes);
      edges.push(...childEdges);
    }
  }

  return { nodes, edges };
}

function findNodeById(tree, id) {
  for (const node of tree) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}