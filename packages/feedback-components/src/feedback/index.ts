import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";

import { Tree, TreeApi } from "react-arborist";
import Node from "./node";
import { FeedbackText } from "./text-visualizer";
import type { InternalEntity, TreeData } from "./types";
import type { Entity } from "../extractions";
import { ModelInfo } from "../extractions";
import {
  TreeDispatchContext,
  treeToGraph,
  useUpdatableTree,
  ViewMode,
} from "./edit-state";
import { useCallback, useEffect, useRef, useState } from "react";
import { ButtonGroup, Card, SegmentedControl, Tag, Popover } from "@blueprintjs/core";
import { OmniboxSelector } from "./type-selector";
import {
  CancelButton,
  DataField,
  FlexBox,
  FlexRow,
  SaveButton,
} from "@macrostrat/ui-components";
import useElementDimensions from "use-element-dimensions";
import { GraphView } from "./graph";
import { useInDarkMode } from "@macrostrat/ui-components";
import { asChromaColor } from "@macrostrat/color-utils";

export type { GraphData } from "./edit-state";
export { treeToGraph } from "./edit-state";
export type { TreeData } from "./types";

const h = hyper.styled(styles);

function setsAreTheSame<T>(a: Set<T>, b: Set<T>) {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

export function FeedbackComponent({
  entities = [],
  text,
  model,
  entityTypes,
  matchComponent,
  onSave,
  lineHeight, 
  allowOverlap,
}) {
  // Get the input arguments
  const [state, dispatch] = useUpdatableTree(
    entities.map(processEntity) as any,
    entityTypes
  );

  const { selectedNodes, tree, selectedEntityType, isSelectingEntityType } =
    state;

  const [{ width, height }, ref] = useElementDimensions();

  return h(TreeDispatchContext.Provider, { value: dispatch }, [
    h(FeedbackText, {
      text,
      dispatch,
      // @ts-ignore
      nodes: tree,
      selectedNodes,
      lineHeight,
      allowOverlap,
    }),
    h(FlexRow, { alignItems: "baseline", justifyContent: "space-between" }, [
      h(ModelInfo, { data: model }),
      h(SegmentedControl, {
        options: [
          { label: "Tree", value: "tree" },
          { label: "Graph", value: "graph" },
        ],
        value: state.viewMode,
        small: true,
        onValueChange(value: ViewMode) {
          console.log("Setting view mode", value);
          dispatch({ type: "set-view-mode", payload: value });
        },
      }),
    ]),
    h(
      "div.entity-panel",
      {
        ref,
      },
      [
        h(Card, { className: "control-panel" }, [
          h(
            ButtonGroup,
            {
              vertical: true,
              fill: true,
              minimal: true,
              alignText: "left",
            },
            [
              h(
                CancelButton,
                {
                  icon: "trash",
                  disabled: state.initialTree == state.tree,
                  onClick() {
                    dispatch({ type: "reset" });
                  },
                },
                "Reset"
              ),
              h(
                SaveButton,
                {
                  onClick() {
                    onSave(state.tree);
                  },
                  disabled: state.initialTree == state.tree,
                },
                "Save"
              ),
            ]
          ),
          h(EntityTypeSelector, {
            entityTypes,
            selected: selectedEntityType,
            onChange(payload) {
              dispatch({ type: "select-entity-type", payload });
            },
            dispatch,
            tree,
            selectedNodes,
            isOpen: isSelectingEntityType,
            setOpen: (isOpen: boolean) =>
              dispatch({
                type: "toggle-entity-type-selector",
                payload: isOpen,
              }),
          }),
        ]),
        h.if(state.viewMode == "tree")(ManagedSelectionTree, {
          selectedNodes,
          dispatch,
          tree,
          width,
          height,
          matchComponent,
        }),
        h.if(state.viewMode == "graph")(GraphView, {
          tree,
          width,
          height,
        }),
      ]
    ),
  ]);
}

function processEntity(entity: Entity): InternalEntity {
  // @ts-ignore
  return {
    ...entity,
    // @ts-ignore
    term_type: entity.type.name,
    txt_range: [entity.indices],
    children: entity.children?.map(processEntity) ?? [],
  };
}

function EntityTypeSelector({
  entityTypes,
  selected,
  isOpen,
  setOpen,
  onChange,
  tree,
  dispatch,
  selectedNodes = [],
}) {
  // Show all entity types when selected is null
  const _selected = selected != null ? selected : undefined;
  const [inputValue, setInputValue] = useState("");
  const types = Array.from(entityTypes.values());

  const items = inputValue !== "" ? types.filter((d) =>
    d.name.toLowerCase().includes(inputValue.toLowerCase())
  ) : types;

  return h('div.entity-type-selector', [
    h('p', "Change Selected Nodes to:"),
    h(TypeList, { types: entityTypes, selected: _selected, dispatch, tree, selectedNodes }),
    h(OmniboxSelector, {
      isOpen,
      items,
      selectedItem: _selected,
      onSelectItem(item) {
        setOpen(false);
        onChange(item);
      },
      onQueryChange(query) {
        setInputValue(query);
      },
      onClose() {
        setOpen(false);
      },
    }),
  ]);
}

function countNodes(tree) {
  if (!tree) return 0;
  let count = 0;

  function recurse(nodes) {
    for (const node of nodes) {
      count++;
      if (node.children && Array.isArray(node.children)) {
        recurse(node.children);
      }
    }
  }

  recurse(tree);
  return count;
}

function ManagedSelectionTree(props) {
  const {
    selectedNodes,
    dispatch,
    tree,
    height,
    width,
    matchComponent,
  } = props;

  const ref = useRef<TreeApi<TreeData>>();
  // Use a ref to track clicks (won't cause rerender)
  const clickedRef = useRef(false);

  const _Node = useCallback(
    (props) => h(Node, { ...props, matchComponent }),
    [matchComponent]
  );

  // Update Tree selection when selectedNodes change
  useEffect(() => {
    if (ref.current == null) return;

    const selection = new Set(selectedNodes.map((d) => d.toString()));
    const currentSelection = ref.current.selectedIds;
    if (setsAreTheSame(selection, currentSelection)) return;

    ref.current.setSelection({
      ids: selectedNodes.map((d) => d.toString()),
      anchor: null,
      mostRecent: null,
    });
  }, [selectedNodes]);

  // Mark clicked when user clicks inside the tree container
  function handleClick() {
    clickedRef.current = true;
  }

  const handleSelect = useCallback(
    (nodes) => {
      if (!clickedRef.current) return;
      clickedRef.current = false;
      console.log("Clicked nodes:", nodes);

      let ids = nodes.map((d) => parseInt(d.id));
      if (ids.length === 1 && ids[0] === selectedNodes[0]) {
        ids = [];
      }

      dispatch({ type: "select-node", payload: { ids } });
    },
    [selectedNodes, dispatch]
  );

  return h(
    "div.selection-tree-wrapper",
    { onPointerDown: handleClick },
    h(Tree, {
      className: "selection-tree",
      height,
      width,
      ref,
      data: tree,
      onMove({ dragIds, parentId, index }) {
        dispatch({
          type: "move-node",
          payload: {
            dragIds: dragIds.map((d) => parseInt(d)),
            parentId: parentId ? parseInt(parentId) : null,
            index,
          },
        });
      },
      onDelete({ ids }) {
        dispatch({
          type: "delete-node",
          payload: { ids: ids.map((d) => parseInt(d)) },
        });
      },
      onSelect: handleSelect,
      children: _Node,
      idAccessor(d) {
        return d.id.toString();
      },
    })
  );
}

function TypeList({ types, selected, dispatch, tree, selectedNodes }) {
  return h(
    "div.type-list",
    Array.from(types.values()).map((type) => {
      const { color, name, id, description } = type;
      const darkMode = useInDarkMode();
      const luminance = darkMode ? 0.9 : 0.4;
      const chromaColor = asChromaColor(color ?? "#000000")

      const payload = {
        id,
        name,
        color,
        description,
      };

      return h(
        Popover, 
        { 
          autoFocus: false,
          content: h(
            'div.description', 
            description || "No description available"
          ),
          interactionKind: "hover"

        }, 
        h('div.type-tag', {
          onClick: () => {
            dispatch({ type: "select-entity-type", payload }); 
          },
          style: {
            cursor: selectedNodes.length ? "pointer" : "",
            color: chromaColor?.luminance(luminance).hex(),
            backgroundColor: chromaColor?.luminance(1 - luminance).hex(),
            border: id === selected?.id && selectedNodes.length ? `1px solid var(--text-emphasized-color)` : `1px solid var(--background-color)`,
          }
        }, name)
      );
    })
  );
}

function collectMatchingIds(tree, name) {
  const ids = [];

  function traverse(node) {
    if (node.term_type === name) {
      ids.push(node.id);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  }

  tree.forEach(traverse);
  return ids;
}
