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
  | { type: "reset" }
  | { type: "delete-entity-type"; payload: { id: number } }
  | {
      type: "add-entity-type";
      payload: { name: string; description: string; color: string };
    }
  | {
      type: "update-entity-type";
      payload: { id: number; name: string; description: string; color: string };
    }
  | { type: "select-range"; payload: { ids: number[] } }
  | { type: "add-match"; payload: { id: number; payload: any } }
  | { type: "remove-match"; payload: { id: number } };

export type TreeDispatch = Dispatch<TreeAction>;

export function useUpdatableTree(
  initialTree: TreeData[],
  entityTypes: Map<number, EntityType>,
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
    case "add-entity-type": {
      // Add a new entity type to the map
      const { name, description, color } = action.payload;
      const newId = state.lastInternalId - 1;
      const newType: EntityType = {
        id: newId,
        name,
        description: description === "" ? null : description,
        color,
      };

      const newEntityTypesMap = new Map(state.entityTypesMap);
      newEntityTypesMap.set(newId, newType);

      return {
        ...state,
        entityTypesMap: newEntityTypesMap,
        selectedEntityType: newType,
        lastInternalId: newId,
      };
    }
    case "update-entity-type": {
      // Update an existing entity type in the map
      const { id, name, description, color } = action.payload;
      const newEntityTypesMap = new Map(state.entityTypesMap);
      const oldType = newEntityTypesMap.get(id);

      if (!oldType) {
        console.warn(`Entity type with id ${id} not found`);
        return state;
      }

      const updatedType: EntityType = {
        ...oldType,
        name,
        description: description === "" ? null : description,
        color,
      };

      newEntityTypesMap.set(id, updatedType);

      // Update the tree to reflect the new type
      const newTree = updateTreeTypes(state.tree, oldType, updatedType);

      return {
        ...state,
        tree: newTree,
        entityTypesMap: newEntityTypesMap,
        selectedEntityType: updatedType,
      };
    }
    case "select-range":
      // Select a range of nodes by their IDs
      const payloadIds = action.payload.ids;
      const node1 = payloadIds[0];
      const node2 = payloadIds[1];

      // make list of nodes in order
      const allNodes = flattenAndSort(state.tree);

      // select all nodes between node1 and node2
      const startIndex = allNodes.findIndex((node) => node.id === node1);
      const endIndex = allNodes.findIndex((node) => node.id === node2);

      const selectedNodes = allNodes.slice(startIndex, endIndex + 1);

      console.log("Selecting range:", selectedNodes);
      return {
        ...state,
        selectedNodes: selectedNodes.map((node) => node.id),
      };

    case "move-node":
      // For each node in the tree, if the node is in the dragIds, remove it from the tree and collect it
      const [newTree, removedNodes] = removeNodes(
        state.tree,
        action.payload.dragIds,
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
        action.payload.ids,
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
          (id) => !action.payload.ids.includes(id),
        ),
      };
    case "select-node":
      const { ids } = action.payload;

      const type =
        action.payload.ids.length > 0
          ? findNodeById(state.tree, ids[0])?.type
          : null;

      return { ...state, selectedNodes: ids, selectedEntityType: type };
    // otherwise fall through to toggle-node-selected for a single ID
    case "toggle-node-selected":
      const nodesToAdd = action.payload.ids.filter(
        (id) => !state.selectedNodes.includes(id),
      );
      const nodesToKeep = state.selectedNodes.filter(
        (id) => !action.payload.ids.includes(id),
      );

      const newType =
        action.payload.ids.length > 0
          ? findNodeById(state.tree, action.payload.ids[0])?.type
          : null;

      return {
        ...state,
        selectedNodes: [...nodesToKeep, ...nodesToAdd],
        selectedEntityType: newType,
      };

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

    case "delete-entity-type": {
      // Remove the entity type from the map
      const { id } = action.payload;
      const newEntityTypesMap = new Map(state.entityTypesMap);
      const oldType = newEntityTypesMap.get(id);
      newEntityTypesMap.delete(id);

      const defaultType = newEntityTypesMap.values().next().value;
      const newTree = updateTreeTypes(state.tree, oldType, defaultType);

      return {
        ...state,
        tree: newTree,
        entityTypesMap: newEntityTypesMap,
        selectedNodes: [],
      };
    }

    case "add-match": {
      const { id } = action.payload;

      // Find the node path
      const keyPath = findNode(state.tree, id);
      if (!keyPath) {
        console.warn(`Node with id ${id} not found`);
        return state;
      }

      // Build update spec to set the `match` property
      const matchUpdateSpec = buildNestedSpec(keyPath, {
        match: { $set: action.payload.payload },
      });

      const updatedTree = update(state.tree, matchUpdateSpec);

      return {
        ...state,
        tree: updatedTree,
      };
    }

    case "remove-match": {
      const { id } = action.payload;

      console.log("Removing match for node with id:", id);

      // Find the node path
      const keyPath = findNode(state.tree, id);
      if (!keyPath) {
        console.warn(`Node with id ${id} not found`);
        return state;
      }

      // Build update spec to unset the `match` property
      const matchUpdateSpec = buildNestedSpec(keyPath, {
        match: { $set: null },
      });

      const updatedTree = update(state.tree, matchUpdateSpec);

      return {
        ...state,
        tree: updatedTree,
      };
    }

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
  innerSpec: Spec<any>,
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
  id: number,
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
  ids: number[],
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
      children,
    };

    nodeMap.set(node.id, node);
    nodes.push(nodeData);

    if (node.children) {
      for (let child of node.children) {
        edges.push({ source: node.id, dest: child.id });
      }

      // Now process the children
      const { nodes: childNodes, edges: childEdges } = treeToGraph(
        node.children,
      );
      nodes.push(...childNodes);
      edges.push(...childEdges);
    }
  }

  return { nodes, edges };
}

export function findNodeById(tree, id) {
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

function updateTreeTypes(tree, oldType, defaultType) {
  return tree.map((node) => updateNodeType(node, oldType, defaultType));
}

function updateNodeType(node, oldType, defaultType) {
  const type = node.type.id === oldType.id ? defaultType : node.type;

  return {
    ...node,
    type,
    children: node.children
      ? updateTreeTypes(node.children, oldType, defaultType)
      : [],
  };
}

function flattenAndSort(nodes) {
  const result = [];

  function traverse(nodeList) {
    for (const node of nodeList) {
      result.push(node);
      if (Array.isArray(node.children) && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);

  // sort by start
  return result.sort((a, b) => a.indices[0] - b.indices[0]);
}
