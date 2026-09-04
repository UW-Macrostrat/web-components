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
  viewOnly: boolean;
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
  | { type: "remove-match"; payload: { id: number } }
  | {
      /** Combine several entities that refer to the same thing into one node
       * that carries every text span. Defaults to the currently selected nodes. */
      type: "merge-nodes";
      payload?: { ids?: number[] };
    }
  | {
      /** Replace the tree wholesale (new input data); clears the selection. */
      type: "replace-tree";
      payload: { tree: TreeData[] };
    }
  | { type: "toggle-view-only" };

export type TreeDispatch = Dispatch<TreeAction>;

export function useUpdatableTree(
  initialTree: TreeData[],
  entityTypes: Map<number, EntityType>,
  viewOnly: boolean,
  autoSelect: string[] = [],
): [TreeState, TreeDispatch] {
  // Get the first entity type
  // issue: grabs second entity instead of selected one
  const type = entityTypes.values().next().value;

  let selectedNodes = [];
  autoSelect = autoSelect.map((name) => name.toLowerCase());

  if (autoSelect.length > 0) {
    // If autoSelect is provided, find the nodes with the matching names
    selectedNodes = initialTree
      .flatMap((node) => node.children ?? [])
      .filter((node) => autoSelect.includes(node.name.toLowerCase()))
      .map((node) => node.id);
  }

  return useReducer(treeReducer, {
    initialTree,
    tree: initialTree,
    selectedNodes,
    entityTypesMap: entityTypes,
    selectedEntityType: type,
    lastInternalId: 0,
    isSelectingEntityType: false,
    viewMode: ViewMode.Tree,
    viewOnly,
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
  if (action.type === "toggle-view-only") {
    return { ...state, viewOnly: !state.viewOnly, selectedNodes: [] };
  }

  if (action.type === "replace-tree") {
    const { tree } = action.payload;
    return { ...state, initialTree: tree, tree, selectedNodes: [] };
  }

  if (state.viewOnly) return viewMode(state, action);

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

    case "add-match": {
      const { id, payload } = action.payload;

      const keyPath = findNode(state.tree, id);
      if (!keyPath) {
        console.warn(`Node with id ${id} not found`);
        return state;
      }

      const matchUpdateSpec = buildNestedSpec(keyPath, {
        match: { $set: payload },
      });

      const updatedTree = update(state.tree, matchUpdateSpec);

      return {
        ...state,
        tree: updatedTree,
      };
    }
    case "remove-match": {
      const { id } = action.payload;

      const keyPath = findNode(state.tree, id);
      if (!keyPath) {
        console.warn(`Node with id ${id} not found`);
        return state;
      }

      const matchUpdateSpec = buildNestedSpec(keyPath, {
        match: { $set: null },
      });

      const updatedTree = update(state.tree, matchUpdateSpec);

      return {
        ...state,
        tree: updatedTree,
      };
    }
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
    case "merge-nodes": {
      const ids = action.payload?.ids ?? state.selectedNodes;
      const merged = mergeNodes(state.tree, ids);
      if (merged == null) return state;
      return { ...state, tree: merged.tree, selectedNodes: [merged.id] };
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
  type_name: string | null;
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

    const { id, name, type, children } = node;

    const nodeData: EntityOutput = {
      id,
      type: type.id,
      type_name: type.name,
      color: type.color,
      name,
      txt_range: spansOf(node),
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

/** Every text span an entity covers. `indices` is the primary span; a merged
 * entity carries the rest in `spans`. */
export function spansOf(node: TreeData): [number, number][] {
  const spans = node.spans ?? [];
  if (spans.length > 0) return spans;
  return [node.indices];
}

function spanKey(span: [number, number]) {
  return `${span[0]}:${span[1]}`;
}

function unionSpans(nodes: TreeData[]): [number, number][] {
  const seen = new Set<string>();
  const out: [number, number][] = [];
  for (const node of nodes) {
    for (const span of spansOf(node)) {
      const key = spanKey(span);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(span);
    }
  }
  return out.sort((a, b) => a[0] - b[0]);
}

/** Merge several nodes into one. The survivor is the shallowest selected node
 * (earliest in the text among equals): it keeps its name, type and position,
 * gains every span and child of the others, and takes a match from them if it
 * has none. The others are removed. Returns null if fewer than two of the ids
 * are in the tree. */
export function mergeNodes(
  tree: TreeData[],
  ids: number[],
): { tree: TreeData[]; id: number } | null {
  const candidates = ids
    .map((id) => ({ id, path: findNode(tree, id) }))
    .filter((d) => d.path != null);
  if (candidates.length < 2) return null;

  candidates.sort((a, b) => {
    if (a.path.length !== b.path.length) return a.path.length - b.path.length;
    const na = findNodeById(tree, a.id);
    const nb = findNodeById(tree, b.id);
    return na.indices[0] - nb.indices[0];
  });
  const survivorId = candidates[0].id;
  const otherIds = candidates.slice(1).map((d) => d.id);

  // Take the others out first (this also detaches any that were nested in
  // each other), then fold them into the survivor.
  const [pruned, removed] = removeNodes(tree, otherIds);
  const survivorPath = findNode(pruned, survivorId);
  if (survivorPath == null) return null;
  const survivor = findNodeById(pruned, survivorId);

  const childIds = new Set((survivor.children ?? []).map((d) => d.id));
  const extraChildren = removed
    .flatMap((node) => node.children ?? [])
    .filter((child) => {
      if (child.id === survivorId || childIds.has(child.id)) return false;
      childIds.add(child.id);
      return true;
    });

  const match =
    survivor.match ?? removed.find((node) => node.match != null)?.match ?? null;

  const spec = buildNestedSpec(survivorPath, {
    spans: { $set: unionSpans([survivor, ...removed]) },
    children: { $set: [...(survivor.children ?? []), ...extraChildren] },
    match: { $set: match },
  });

  return { tree: update(pruned, spec), id: survivorId };
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


function viewMode(state, action) {
  if (action.type === "set-view-mode") {
    return { ...state, viewMode: action.payload };
  }

  return state;
}
