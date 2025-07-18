import styles from "./feedback.module.sass";
import hyper from "@macrostrat/hyper";

import { getTagStyle } from "../extractions";
import { useState } from "react";
import { Icon, Popover, Overlay2 } from "@blueprintjs/core";
import { SaveButton } from "@macrostrat/ui-components";
import { useInDarkMode } from "@macrostrat/ui-components";
import { ColorPicker } from "@macrostrat/data-sheet";

const h = hyper.styled(styles);

export function TypeList({
  types,
  selected,
  dispatch,
  selectedNodes,
  tree,
  viewOnly,
}) {
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
          viewOnly,
          tree,
          selectedNodes,
          selected,
          isSelectedNodes,
        }),
      ),
    ),
    h.if(!viewOnly)(AddType, { dispatch }),
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
  viewOnly,
}) {
  const { color, name, id, description } = type;
  const darkMode = useInDarkMode();
  const isSelected = id === selected?.id && selectedNodes.length > 0;

  const style = getTagStyle(color, {
    active: isSelected,
    highlighted: selectedNodes.length === 0,
  });

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
            (ids.length > 0 || (isSelectedNodes && !selectedType)) && !viewOnly
              ? "pointer"
              : "",
          color: "black",
          backgroundColor: style.backgroundColor,
          border: isSelected
            ? `1px solid var(--text-emphasized-color)`
            : `1px solid var(--background-color)`,
        },
      },
      h("div.type-container", [
        h("div.type-name", name),
        h.if(!viewOnly)("div.icons", [
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
