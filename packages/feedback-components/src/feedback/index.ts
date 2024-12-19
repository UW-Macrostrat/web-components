import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";

import { Tree, TreeApi } from "react-arborist";
import Node from "./node";
import { FeedbackText } from "./text-visualizer";
import type { InternalEntity, TreeData } from "./types";
import type { Entity } from "../extractions";
import { ModelInfo } from "../extractions";
import { TreeDispatchContext, useUpdatableTree } from "./edit-state";
import { useCallback, useEffect, useRef } from "react";
import { ButtonGroup, Card } from "@blueprintjs/core";
import { OmniboxSelector } from "./type-selector";
import { CancelButton, DataField, SaveButton } from "@macrostrat/ui-components";
import useElementDimensions from "use-element-dimensions";

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
}) {
  // Get the input arguments

  const [state, dispatch] = useUpdatableTree(
    entities.map(processEntity),
    entityTypes
  );

  const { selectedNodes, tree, selectedEntityType, isSelectingEntityType } =
    state;

  const [{ width, height }, ref] = useElementDimensions();

  return h(TreeDispatchContext.Provider, { value: dispatch }, [
    h(FeedbackText, {
      text,
      dispatch,
      nodes: tree,
      selectedNodes,
    }),
    h(ModelInfo, { data: model }),
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
            isOpen: isSelectingEntityType,
            setOpen: (isOpen: boolean) =>
              dispatch({
                type: "toggle-entity-type-selector",
                payload: isOpen,
              }),
          }),
        ]),
        h(ManagedSelectionTree, {
          selectedNodes,
          dispatch,
          tree,
          width,
          height,
          matchComponent,
        }),
      ]
    ),
  ]);
}

function processEntity(entity: Entity): InternalEntity {
  return {
    ...entity,
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
}) {
  // Show all entity types when selected is null
  const _selected = selected != null ? selected : undefined;
  return h(DataField, { label: "Entity type", inline: true }, [
    h(
      "code.bp5-code",
      {
        onClick() {
          setOpen((d) => !d);
        },
      },
      selected.name
    ),
    h(OmniboxSelector, {
      isOpen,
      items: Array.from(entityTypes.values()),
      selectedItem: _selected,
      onSelectItem(item) {
        setOpen(false);
        onChange(item);
      },
      onClose() {
        setOpen(false);
      },
    }),
  ]);
}

function ManagedSelectionTree(props) {
  const {
    selectedNodes,
    dispatch,
    tree,
    height,
    width,
    matchComponent,
    ...rest
  } = props;

  const ref = useRef<TreeApi<TreeData>>();

  const _Node = useCallback(
    (props) => h(Node, { ...props, matchComponent }),
    [matchComponent]
  );

  useEffect(() => {
    if (ref.current == null) return;
    // Check if selection matches current
    const selection = new Set(selectedNodes.map((d) => d.toString()));
    const currentSelection = ref.current.selectedIds;
    if (setsAreTheSame(selection, currentSelection)) return;
    // If the selection is the same, do nothing

    // Set selection
    ref.current.setSelection({
      ids: selectedNodes.map((d) => d.toString()),
      anchor: null,
      mostRecent: null,
    });
  }, [selectedNodes]);

  return h(Tree, {
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
    onSelect(nodes) {
      let ids = nodes.map((d) => parseInt(d.id));
      if (ids.length == 1 && ids[0] == selectedNodes[0]) {
        // Deselect
        ids = [];
      }
      dispatch({ type: "select-node", payload: { ids } });
    },
    children: _Node,
    idAccessor(d: TreeData) {
      return d.id.toString();
    },
  });
}