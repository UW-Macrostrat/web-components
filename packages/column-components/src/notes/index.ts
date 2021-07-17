/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component, useContext } from "react";
import h from "../hyper";
import T from "prop-types";
import { NotesList } from "./note";
import NoteDefs from "./defs";
import { NoteShape } from "./types";
import { useModelEditor, ColumnContext } from "../context";
import { NoteLayoutProvider, NoteUnderlay } from "./layout";
import {
  NoteEditor,
  NoteTextEditor,
  NoteEditorContext,
  NoteEditorProvider
} from "./editor";
import { NewNotePositioner } from "./new";

const NoteComponent = function(props) {
  const { visibility, note, onClick } = props;
  const text = note.note;
  return h(
    "p.col-note-label",
    {
      style: { visibility },
      onClick
    },
    text
  );
};

NoteComponent.propTypes = {
  onClick: T.func,
  note: NoteShape.isRequired
};

const CancelEditUnderlay = function() {
  const { setEditingNote } = useContext(NoteEditorContext);
  const { confirmChanges } = useModelEditor();
  return h(NoteUnderlay, {
    onClick() {
      console.log("Clicked to cancel note editing");
      return setEditingNote(null);
    }
  });
};

function EditableNotesColumn(props) {
  const {
    width,
    paddingLeft = 60,
    transform,
    notes,
    inEditMode = false,
    onUpdateNote,
    onDeleteNote,
    onCreateNote,
    noteComponent = NoteComponent,
    noteEditor = NoteTextEditor,
    allowPositionEditing = false,
    forceOptions
  } = props;

  const innerWidth = width - paddingLeft;

  return h(
    NoteLayoutProvider,
    {
      notes,
      width: innerWidth,
      paddingLeft,
      noteComponent,
      forceOptions
    },
    [
      h(
        NoteEditorProvider,
        {
          inEditMode,
          noteEditor,
          onCreateNote,
          onUpdateNote,
          onDeleteNote
        },
        [
          h("g.section-log", { transform }, [
            h(NoteDefs),
            h(CancelEditUnderlay),
            h(NotesList, {
              editHandler: inEditMode ? onUpdateNote : null,
              inEditMode
            }),
            h(NewNotePositioner),
            h(NoteEditor, { allowPositionEditing })
          ])
        ]
      )
    ]
  );
}
EditableNotesColumn.propTypes = {
  notes: T.arrayOf(NoteShape).isRequired,
  width: T.number.isRequired,
  paddingLeft: T.number,
  onUpdateNote: T.func,
  onCreateNote: T.func,
  onDeleteNote: T.func,
  editingNote: NoteShape,
  onEditNote: T.func,
  inEditMode: T.bool,
  noteComponent: T.elementType,
  noteEditor: T.elementType,
  allowPositionEditing: T.bool,
  forceOptions: T.options
};

const StaticNotesColumn = function(props) {
  const { width, paddingLeft, transform, notes, noteComponent } = props;

  const innerWidth = width - paddingLeft;

  return h(
    NoteLayoutProvider,
    {
      notes,
      width: innerWidth,
      paddingLeft,
      noteComponent
    },
    [
      h("g.section-log", { transform }, [
        h(NoteDefs),
        h(NotesList, { inEditMode: false })
      ])
    ]
  );
};

StaticNotesColumn.defaultProps = {
  paddingLeft: 60,
  noteComponent: NoteComponent
};

StaticNotesColumn.propTypes = {
  notes: T.arrayOf(NoteShape).isRequired,
  width: T.number.isRequired,
  paddingLeft: T.number,
  noteComponent: T.elementType
};

const NotesColumn = function(props) {
  const { editable, ...rest } = props;
  const ctx = useContext(ColumnContext);
  if (ctx?.scaleClamped == null) return null;

  const c = editable ? EditableNotesColumn : StaticNotesColumn;
  return h(c, rest);
};

NotesColumn.defaultProps = { editable: true };

interface NotesColumnProps {
  editable: boolean;
}

export {
  NotesColumn,
  NoteComponent,
  NoteTextEditor,
  NoteEditor,
  NoteEditorContext,
  NotesColumnProps
};
