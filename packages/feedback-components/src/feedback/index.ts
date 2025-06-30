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
  Icon,
  Popover,
  Divider,
  Overlay2,
} from "@blueprintjs/core";
import { OmniboxSelector } from "./type-selector";
import {
  CancelButton,
  DataField,
  ErrorBoundary,
  FlexBox,
  FlexRow,
  SaveButton,
} from "@macrostrat/ui-components";
import useElementDimensions from "use-element-dimensions";
import { GraphView } from "./graph";
import { useInDarkMode } from "@macrostrat/ui-components";
import { asChromaColor } from "@macrostrat/color-utils";
import { ColorPicker } from "@macrostrat/data-sheet";

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
}) {
  // Get the input arguments
  const [state, dispatch] = useUpdatableTree(
    entities.map(processEntity) as any,
    entityTypes,
  );

  const {
    selectedNodes,
    tree,
    selectedEntityType,
    isSelectingEntityType,
    entityTypesMap,
  } = state;

  const [{ width, height }, ref] = useElementDimensions();

  return     h('div.page-wrapper', [
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
          h(Divider),
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
          }),
        ]),
    h('div.feedback-container', 
    h(TreeDispatchContext.Provider, { value: dispatch }, [
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
      }),
    ),
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
          dispatch,
          selectedNodes,
        }),
      ],
    ),
  ]))
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
  const { selectedNodes, dispatch, tree, height, width, matchComponent } =
    props;

  const ref = useRef<TreeApi<TreeData>>();
  // Use a ref to track clicks (won't cause rerender)
  const clickedRef = useRef(false);

  const _Node = useCallback(
    (props) => h(Node, { ...props, matchComponent }),
    [matchComponent],
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

      let ids = nodes.map((d) => parseInt(d.id));

      dispatch({ type: "toggle-node-selected", payload: { ids } });
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

function TypeList({ types, selected, dispatch, selectedNodes, tree }) {
  const [selectedType, setSelectedType] = useState(null);
  const isSelectedNodes = selectedNodes.length > 0;
  const darkMode = useInDarkMode();
  const luminance = darkMode ? 0.9 : 0.4;

  return h("div.type-list-container", [
    h(
      "div.type-list-header",
      isSelectedNodes && !selectedType
        ? "Change selected nodes to:"
        : "Entity Types",
    ),
    h(
      "div.type-list",
      Array.from(types.values()).map((type) =>
        h(TypeTag, {
          type,
          luminance,
          selectedType,
          setSelectedType,
          dispatch,
          tree,
          selectedNodes,
          selected,
          isSelectedNodes,
        }),
      ),
    ),
    h(AddType, { dispatch }),
  ]);
}

function collectMatchingIds(tree, id) {
  const ids = [];

  function traverse(node) {
    if (node.type.id === id) {
      ids.push(node.id);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  }

  tree.forEach(traverse);
  return ids;
}

function AddType({ dispatch }) {
  const [overlayOpen, setOverlayOpen] = useState(false);

  const saveHandler = (payload) => {
    dispatch({
      type: "add-entity-type",
      payload,
    });
    setOverlayOpen(false);
  };

  return h("div.add-type-container", [
    h("div.add-type", { onClick: () => setOverlayOpen(true) }, [
      h("p.add-type-text", "Add new type"),
      h(Icon, { icon: "plus" }),
    ]),
    h(TypeOverlay, {
      setOverlayOpen,
      overlayOpen,
      title: "Add New Type",
      saveHandler,
    }),
  ]);
}

function EditType({ dispatch, type }) {
  const [editorOpen, setEditorOpen] = useState(false);

  const saveHandler = (payload) => {
    dispatch({
      type: "update-entity-type",
      payload,
    });
    setEditorOpen(false);
  };

  return h("div.edit-type", [
    h(Icon, {
      icon: "edit",
      className: "edit-icon",
      onClick: (e) => {
        e.stopPropagation();
        setEditorOpen(true);
      },
    }),
    h(TypeOverlay, {
      setOverlayOpen: setEditorOpen,
      overlayOpen: editorOpen,
      originalType: type,
      title: "Edit Type",
      saveHandler,
    }),
  ]);
}

function TypeOverlay({
  setOverlayOpen,
  overlayOpen,
  originalType,
  title,
  saveHandler,
}) {
  const { name, description, color, id } = originalType || {};

  const [nameInput, setNameInput] = useState(name || "");
  const [descriptionInput, setDescriptionInput] = useState(description || "");
  const [colorInput, setColorInput] = useState(color || "#fff");

  return h(
    Overlay2,
    {
      isOpen: overlayOpen,
    },
    h(
      "div.overlay-container",
      h("div.add-type-overlay", [
        h("h2.title", [
          title,
          h(Icon, {
            icon: "cross",
            className: "close-icon",
            onClick: () => {
              setOverlayOpen(false);
            },
            style: { cursor: "pointer", color: "red" },
          }),
        ]),
        h("div.form-group", [
          h("div.text-inputs", [
            h("div.form-field.name", [
              h("p.label", "Name"),
              h("input", {
                type: "text",
                placeholder: "Enter type name",
                onChange: (e) => setNameInput(e.target.value),
                value: nameInput,
              }),
            ]),
            h("div.form-field.form-description", [
              h("p.label", "Description"),
              h("input", {
                type: "text",
                placeholder: "Enter type description",
                onChange: (e) => setDescriptionInput(e.target.value),
                value: descriptionInput,
              }),
            ]),
          ]),
          h("div.form-field.color", [
            h("p.label", "Color"),
            h(ColorPicker, {
              value: colorInput,
              onChange: (color) => setColorInput(color),
              style: { width: "100%" },
            }),
          ]),
        ]),
        h(
          SaveButton,
          {
            className: "save-btn",
            small: true,
            onClick: () =>
              saveHandler({
                name: nameInput,
                description: descriptionInput,
                color: colorInput,
                id,
              }),
          },
          "Save changes",
        ),
      ]),
    ),
  );
}

function TypeTag({
  type,
  luminance,
  selectedType,
  setSelectedType,
  dispatch,
  tree,
  selectedNodes,
  selected,
  isSelectedNodes,
}) {
  const { color, name, id, description } = type;
  const darkMode = useInDarkMode();
  const isSelected = id === selected?.id && selectedNodes.length > 0;

  const style = getTagStyle(color, {active: isSelected, highlighted: selectedNodes.length === 0});

  const payload = {
    id,
    name,
    color,
    description,
  };

  const ids = collectMatchingIds(tree, id);

  const handleTagClick = () => {
    if (!isSelectedNodes && selectedType === null) {
      if (ids.length > 0) {
        setSelectedType(type);
        dispatch({ type: "toggle-node-selected", payload: { ids } });
      }
    } else if (isSelectedNodes && selectedType === null) {
      if (id === selected?.id && selectedNodes.length > 0) {
        dispatch({
          type: "toggle-node-selected",
          payload: { ids: selectedNodes },
        });
      } else {
        dispatch({ type: "select-entity-type", payload });
      }
    } else if (isSelectedNodes && selectedType.id === id) {
      setSelectedType(null);
      dispatch({ type: "toggle-node-selected", payload: { ids } });
    } else if (isSelectedNodes && selectedType.id !== id) {
      if (ids.length > 0) {
        setSelectedType(type);
        const oldIds = collectMatchingIds(tree, selectedType.id);

        dispatch({ type: "toggle-node-selected", payload: { ids: oldIds } });
        dispatch({ type: "toggle-node-selected", payload: { ids } });
      }
    } else {
      console.warn("Unexpected state in TypeTag click handler", {
        isSelectedNodes,
        selectedType,
        selectedNodes,
        ids,
        id,
        selected,
      });
    }
  };

  return h(
    Popover,
    {
      autoFocus: false,
      content: h("div.description", description || "No description available"),
      interactionKind: "hover",
    },
    h(
      "div.type-tag",
      {
        onClick: handleTagClick,
        style: {
          cursor:
            ids.length > 0 || (isSelectedNodes && !selectedType)
              ? "pointer"
              : "",
          color: "black",
          backgroundColor: style.backgroundColor,
          border:
            isSelected
              ? `1px solid var(--text-emphasized-color)`
              : `1px solid var(--background-color)`,
        },
      },
      h("div.type-container", [
        h("div.type-name", name),
        h("div.icons", [
          h(EditType, {
            dispatch,
            type,
          }),
          h(Icon, {
            icon: "cross",
            className: "delete-type-icon",
            style: { color: "red", cursor: "pointer" },
            onClick: (e) => {
              e.stopPropagation();
              dispatch({
                type: "delete-entity-type",
                payload: { id },
              });
            },
          }),
        ]),
      ]),
    ),
  );
}
