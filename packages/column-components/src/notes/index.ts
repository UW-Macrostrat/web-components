/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component, useContext } from "react"
import h from "../hyper"
import T from "prop-types"
import { NotesList } from "./note"
import NoteDefs from "./defs"
import { NoteShape } from "./types"
import { useModelEditor } from "../context"
import { NoteLayoutProvider, NoteUnderlay } from "./layout"
import {
  NoteEditor,
  NoteTextEditor,
  NoteEditorContext,
  NoteEditorProvider,
} from "./editor"
import { NewNotePositioner } from "./new"
import { INote } from "./index.d"

interface NoteComponentProps {
  visibility: "hidden" | "visible" | null
  note: INote
  onClick(): void
}

const NoteComponent = function(props: NoteComponentProps) {
  const { visibility, note, onClick } = props
  const text = note.note
  return h(
    "p.col-note-label",
    {
      style: { visibility },
      onClick,
    },
    text
  )
}

NoteComponent.propTypes = {
  onClick: T.func,
  note: NoteShape.isRequired,
}

const CancelEditUnderlay = function() {
  const { setEditingNote } = useContext(NoteEditorContext)
  const { confirmChanges } = useModelEditor()
  return h(NoteUnderlay, {
    onClick() {
      return setEditingNote(null)
    },
  })
}

class EditableNotesColumn extends Component {
  static initClass() {
    this.defaultProps = {
      type: "log-notes",
      paddingLeft: 60,
      inEditMode: false,
      noteComponent: NoteComponent,
      noteEditor: NoteTextEditor,
      allowPositionEditing: false,
      allowCreation: false,
    }
    this.propTypes = {
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
      forceOptions: T.options,
    }
  }
  render() {
    const {
      width,
      paddingLeft,
      transform,
      notes,
      inEditMode,
      onUpdateNote,
      onDeleteNote,
      onCreateNote,
      noteComponent,
      noteEditor,
      allowPositionEditing,
      forceOptions,
    } = this.props

    let editHandler = onUpdateNote
    if (!inEditMode) {
      editHandler = null
    }

    const innerWidth = width - paddingLeft

    return h(
      NoteLayoutProvider,
      {
        notes,
        width: innerWidth,
        paddingLeft,
        noteComponent,
        forceOptions,
      },
      [
        h(
          NoteEditorProvider,
          {
            inEditMode,
            noteEditor,
            onCreateNote,
            onUpdateNote,
            onDeleteNote,
          },
          [
            h("g.section-log", { transform }, [
              h(NoteDefs),
              h(CancelEditUnderlay),
              h(NotesList, {
                editHandler,
                inEditMode,
              }),
              h(NewNotePositioner),
              h(NoteEditor, { allowPositionEditing }),
            ]),
          ]
        ),
      ]
    )
  }
}
EditableNotesColumn.initClass()

interface StaticNotesProps {
  paddingLeft: number
  width: number
  transform?: string
  notes: INote[]
  noteComponent?: React.Component<NoteComponentProps>
}

const StaticNotesColumn = function(props: StaticNotesProps) {
  const { width, paddingLeft, transform, notes, noteComponent } = props

  const innerWidth = width - paddingLeft

  return h(
    NoteLayoutProvider,
    {
      notes,
      width: innerWidth,
      paddingLeft,
      noteComponent,
    },
    [
      h("g.section-log", { transform }, [
        h(NoteDefs),
        h(NotesList, { inEditMode: false }),
      ]),
    ]
  )
}

StaticNotesColumn.defaultProps = {
  paddingLeft: 60,
  noteComponent: NoteComponent,
}

StaticNotesColumn.propTypes = {
  notes: T.arrayOf(NoteShape).isRequired,
  width: T.number.isRequired,
  paddingLeft: T.number,
  noteComponent: T.elementType,
}

interface NotesColumnProps extends StaticNotesProps {
  editable: boolean
}

const NotesColumn = function(props: NotesColumnProps) {
  const { editable = true, ...rest } = props
  const c = editable ? EditableNotesColumn : StaticNotesColumn
  return h(c, rest)
}

export {
  NotesColumn,
  NoteComponent,
  NoteTextEditor,
  NoteEditor,
  NoteEditorContext,
  NotesColumnProps,
}
