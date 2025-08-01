import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";

import { Tree, TreeApi } from "react-arborist";
import Node from "./node";
import { FeedbackText } from "./text-visualizer";
import type { InternalEntity, TreeData } from "./types";
import type { Entity } from "../extractions";
import { getTagStyle, ModelInfo } from "../extractions";
import {
  TreeDispatchContext,
  treeToGraph,
  useUpdatableTree,
  ViewMode,
} from "./edit-state";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ButtonGroup,
  Card,
  SegmentedControl,
  Divider,
} from "@blueprintjs/core";
import { OmniboxSelector } from "./type-selector";
import {
  CancelButton,
  ErrorBoundary,
  FlexRow,
  SaveButton,
} from "@macrostrat/ui-components";
import useElementDimensions from "use-element-dimensions";
import { GraphView } from "./graph";

import { Matches } from "./matches";
import { TypeList } from "./typelist";

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
  allowOverlap,
  matchLinks,
  view = false,
  autoSelect = [],
}) {
  const [viewOnly, setViewOnly] = useState(view);
  const [match, setMatchLinks] = useState(matchLinks);
  const matchMode = match !== undefined;

  // Get the input arguments
  const [state, dispatch] = useUpdatableTree(
    entities.map(processEntity) as any,
    entityTypes,
    viewOnly,
    matchMode,
    autoSelect,
  );

  const {
    selectedNodes,
    tree,
    selectedEntityType,
    isSelectingEntityType,
    entityTypesMap,
  } = state;

  const [{ width, height }, ref] = useElementDimensions();

  return h("div.page-wrapper", [
    h(
      "div.feedback-container",
      h(TreeDispatchContext.Provider, { value: dispatch }, [
        h.if(!view)(SegmentedControl, {
          options: [
            { label: "View", value: "view" },
            { label: "Edit", value: "edit" },
          ],
          value: viewOnly ? "view" : "edit",
          small: true,
          onValueChange() {
            setViewOnly(!viewOnly);
            dispatch({ type: "toggle-view-only" });
          },
          role: "toolbar",
        }),
        h(
          ErrorBoundary,
          {
            description:
              "An error occurred while rendering the feedback text component.",
          },
          h(FeedbackText, {
            text,
            dispatch,
            // @ts-ignore
            nodes: tree,
            selectedNodes,
            allowOverlap,
            matchLinks: match,
            viewOnly,
          }),
        ),
        h(
          FlexRow,
          { alignItems: "baseline", justifyContent: "space-between" },
          [
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
          ],
        ),
        h(
          "div.entity-panel",
          {
            ref,
          },
          [
            h.if(state.viewMode == "tree")(ManagedSelectionTree, {
              selectedNodes,
              dispatch,
              tree,
              width,
              height,
              matchComponent,
              viewOnly,
            }),
            h.if(state.viewMode == "graph")(GraphView, {
              tree,
              width,
              height,
              dispatch,
              selectedNodes,
              viewOnly,
            }),
          ],
        ),
      ]),
    ),
    h(Card, { className: "control-panel" }, [
      h("div.control-content", [
        h.if(!viewOnly)(
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
              "Reset",
            ),
            h(
              SaveButton,
              {
                onClick() {
                  onSave(state.tree);
                },
                disabled: state.initialTree == state.tree,
              },
              "Save",
            ),
          ],
        ),
        h.if(!viewOnly)(Matches, {
          match,
          setMatchLinks,
          matchLinks,
          selectedNodes,
          tree,
          dispatch,
        }),
        h.if(!viewOnly)(Divider),
        h(EntityTypeSelector, {
          entityTypes: entityTypesMap,
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
          viewOnly,
          matchMode,
        }),
      ]),
    ]),
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
  viewOnly,
  matchMode,
}) {
  // Show all entity types when selected is null
  const _selected = selected != null ? selected : undefined;
  const [inputValue, setInputValue] = useState("");
  const types = Array.from(entityTypes.values());

  const items =
    inputValue !== ""
      ? types.filter((d) =>
          d.name.toLowerCase().includes(inputValue.toLowerCase()),
        )
      : types;

  return h("div.entity-type-selector", [
    h(TypeList, {
      types: entityTypes,
      selected: _selected,
      dispatch,
      selectedNodes,
      tree,
      viewOnly: viewOnly || matchMode,
    }),
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
    viewOnly,
  } = props;

  const ref = useRef<TreeApi<TreeData>>();
  // Use a ref to track clicks (won't cause rerender)
  const clickedRef = useRef(false);

  const _Node = useCallback(
    (props) => h(Node, { ...props, matchComponent, viewOnly }),
    [matchComponent, viewOnly],
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

  const ctrlPressedRef = useRef(false);

  useEffect(() => {
    const down = (e) => {
      if (e.ctrlKey || e.metaKey) ctrlPressedRef.current = true;
    };
    const up = () => (ctrlPressedRef.current = false);

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const handleSelect = useCallback(
    (nodes) => {
      if (!clickedRef.current) return;
      clickedRef.current = false;
      const isMultiSelect = ctrlPressedRef.current;

      let ids = nodes.map((d) => parseInt(d.id));

      if (isMultiSelect) {
        dispatch({ type: "toggle-node-selected", payload: { ids } });
      } else {
        if (ids.length === 1 && ids[0] === selectedNodes[0]) {
          ids = [];
        }

        dispatch({ type: "select-node", payload: { ids } });
      }
    },
    [selectedNodes, dispatch],
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
    }),
  );
}
