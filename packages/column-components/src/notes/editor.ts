import { createContext, useState, useContext, ComponentType } from "react";
import { ModelEditorProvider, useModelEditor, ColumnContext } from "../context";
import { EditableText } from "@blueprintjs/core";
import classNames from "classnames";
import h from "../hyper";
import { NoteData } from "./types";
import { ForeignObject } from "../util";
import { NoteLayoutContext, NoteRect } from "./layout";
import { NotePositioner, NoteConnector } from "./connector";
import Draggable from "react-draggable";
import { hasSpan } from "./utils";
import { ErrorBoundary } from "@macrostrat/ui-components";
import { Spec } from "immutability-helper";

const NoteEditorContext = createContext({ inEditMode: false });

interface NoteEditorProps {
  note: NoteData;
}

const NoteTextEditor = function (props: NoteEditorProps) {
  const { updateModel } = useModelEditor();
  const { note } = props;
  return h(EditableText, {
    multiline: true,
    className: "col-note-label note-editing",
    defaultValue: note.note,
    isEditing: true,
    onConfirm(newText) {
      return updateModel({ note: { $set: newText } });
    },
  });
};

interface NoteEditorProviderProps {
  inEditMode: boolean;
  noteEditor: ComponentType<NoteEditorProps>;
  onUpdateNote?: (n: NoteData) => void;
  onDeleteNote?: (n: NoteData) => void;
  onCreateNote?: Function;
  children?: React.ReactNode;
}

function NoteEditorProvider(props: NoteEditorProviderProps) {
  let { children, inEditMode = false, noteEditor } = props;
  const { notes } = useContext(NoteLayoutContext);

  const [editingNote, setEditingNote] = useState(null);

  const deleteNote = function () {
    const val = editingNote;
    setEditingNote(null);
    return props.onDeleteNote?.(val);
  };

  const onCreateNote = function (pos) {
    const { height, top_height } = pos;
    const val = { height, top_height, note: null, symbol: null };
    return setEditingNote(val);
  };

  const value = {
    editingNote,
    setEditingNote,
    deleteNote,
    inEditMode,
    noteEditor,
    onCreateNote,
  };

  const onConfirmChanges = function (n) {
    if (n?.note == null && n == editingNote) {
      console.log("No changes to note");
      return;
    }
    if (notes.includes(n)) {
      return;
    }
    return props.onUpdateNote?.(n);
  };

  //# Model editor provider gives us a nice store
  return h(NoteEditorContext.Provider, { value }, [
    h(
      ModelEditorProvider,
      {
        model: editingNote,
        onDelete: deleteNote,
        onConfirmChanges,
        logUpdates: true,
        alwaysConfirm: true,
      },
      children,
    ),
  ]);
}

const NoteConnectorPath = function (props) {
  const { d, offsetX, className } = props;
  return h("path", {
    d,
    className,
    transform: `translate(${offsetX})`,
    fill: "transparent",
  });
};

const EditableNoteConnector = function (props) {
  const { notes, nodes, columnIndex, generatePath, createNodeForNote } =
    useContext(NoteLayoutContext);
  let { note, node, index } = props;
  if (note.id != null) {
    node = nodes[note.id];
  }
  if (node == null) {
    node = createNodeForNote(note);
  }
  const x = columnIndex[note.id] * 5 || 0;

  const d = generatePath(node, x);

  return h([
    h(NoteConnectorPath, {
      className: "note-connector",
      d,
      offsetX: x,
    }),
    h(
      ForeignObject,
      {
        width: 30,
        x,
        y: 0,
        height: 1,
        style: { overflowY: "visible" },
      },
      h(PositionEditorInner, { note }),
    ),
  ]);
};

const PointHandle = function (props) {
  let { height, size, className, ...rest } = props;
  className = classNames("handle point-handle", className);
  if (size == null) {
    size = 10;
  }
  return h(
    Draggable,
    {
      position: { x: 0, y: height },
      axis: "y",
      ...rest,
    },
    h("div.handle", {
      style: {
        height: size,
        width: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        position: "absolute",
      },
      className,
    }),
  );
};

function PositionEditorInner(props) {
  let updateModel;
  let { note, margin } = props;
  if (margin == null) {
    margin = 3;
  }
  const { scaleClamped: scale } = useContext(ColumnContext);
  ({ updateModel, editedModel: note } = useModelEditor());
  if (note == null) {
    return null;
  }

  const noteHasSpan = hasSpan(note);

  const bottomHeight = scale(note.height);
  let topHeight = bottomHeight;
  let height = 0;
  if (noteHasSpan) {
    topHeight = scale(note.top_height);
    height = Math.abs(topHeight - bottomHeight);
  }

  const moveEntireNote = function (e, data) {
    const { y } = data;
    // Set note height
    const spec: Spec<any> = { height: { $set: scale.invert(y + height) } };
    if (noteHasSpan) {
      // Set note top height
      spec.top_height = { $set: scale.invert(y) };
    }
    return updateModel(spec);
  };

  const moveTop = function (e, data) {
    const spec = { top_height: { $set: scale.invert(data.y) } };
    if (Math.abs(data.y - bottomHeight) < 2) {
      spec.top_height = { $set: null };
    }
    return updateModel(spec);
  };

  const moveBottom = function (e, data) {
    const spec: Spec<any> = { height: { $set: scale.invert(data.y) } };
    if (Math.abs(data.y - topHeight) < 2) {
      spec.top_height = { $set: null };
    }
    return updateModel(spec);
  };

  return h(
    ErrorBoundary,
    null,
    h("div.position-editor", [
      h(
        Draggable,
        {
          handle: ".handle",
          position: { x: 0, y: topHeight },
          onDrag: moveEntireNote,
          axis: "y",
        },
        h("div", [
          h("div.handle", {
            className: "handle",
            style: {
              height,
              width: 2 * margin,
              marginLeft: -margin,
              marginTop: -margin,
              position: "absolute",
            },
          }),
        ]),
      ),
      h(PointHandle, {
        height: noteHasSpan ? topHeight : topHeight - 15,
        onDrag: moveTop,
        className: classNames("top-handle", {
          "add-span-handle": !noteHasSpan,
        }),
        bounds: { bottom: bottomHeight },
      }),
      h(PointHandle, {
        height: bottomHeight,
        onDrag: moveBottom,
        className: "bottom-handle",
        bounds: noteHasSpan ? { top: topHeight } : null,
      }),
    ]),
  );
}

function NoteEditorUnderlay() {
  return h(NoteRect, {
    style: { pointerEvents: "none" },
    className: "underlay",
  });
}

function NoteEditor(props) {
  const { allowPositionEditing } = props;
  const { noteEditor, setEditingNote } = useContext(NoteEditorContext) as any;
  const { notes, nodes, elementHeights, createNodeForNote } =
    useContext(NoteLayoutContext);
  const { editedModel, model } = useModelEditor();
  if (editedModel == null) {
    return null;
  }
  const index = notes.indexOf(editedModel);
  const { id: noteID } = editedModel;
  let node = nodes[noteID] || createNodeForNote(editedModel);
  const noteHeight = elementHeights[noteID] || 20;

  if (editedModel.height != null) {
    const newNode = createNodeForNote(editedModel);
    // Set position of note to current position
    newNode.currentPos = node.currentPos;

    const pos = newNode.centerPos || newNode.idealPos;
    const dy = pos - node.currentPos;
    if (dy > 50) {
      newNode.currentPos = pos - 50;
    }
    if (dy < -50) {
      newNode.currentPos = pos + 50;
    }
    node = newNode;
  }

  const edited = editedModel === model;

  return h(ErrorBoundary, [
    h("g.note-editor.note", [
      h(NoteEditorUnderlay),
      h.if(!allowPositionEditing)(NoteConnector, { note: editedModel }),
      h.if(allowPositionEditing)(EditableNoteConnector, {
        note: editedModel,
        node,
      }),
      h(
        NotePositioner,
        {
          offsetY: node.currentPos,
          noteHeight,
          onClick(evt) {
            if (edited) {
              setEditingNote(null);
              evt.stopPropagation();
            }
          },
        },
        [
          h(noteEditor, {
            note: editedModel,
            key: index,
            focused: true,
            edited,
          }),
        ],
      ),
    ]),
  ]);
}

export type { NoteData };
export { NoteEditorProvider, NoteEditorContext, NoteTextEditor, NoteEditor };
