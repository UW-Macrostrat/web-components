import {Component, useContext} from "react"
import h from "../hyper"
import T from "prop-types"
import {NotesList} from './note'
import NoteDefs from './defs'
import {NoteShape} from './types'
import {useModelEditor} from '../context'
import {NoteLayoutProvider, NoteUnderlay} from './layout'
import {
  NoteEditor,
  NoteTextEditor,
  NoteEditorContext,
  NoteEditorProvider
} from './editor'
import {
  NewNotePositioner
} from './new'


NoteComponent = (props)->
  {visibility, note, onClick} = props
  text = note.note
  h 'p.mc-note-label', {
    style: {visibility}
    onClick
  }, text

NoteComponent.propTypes = {
  onClick: T.func
  note: NoteShape.isRequired
}

CancelEditUnderlay = ->
  {setEditingNote} = useContext(NoteEditorContext)
  {confirmChanges} = useModelEditor()
  h NoteUnderlay, {
    onClick: ->
      setEditingNote(null)
  }

class EditableNotesColumn extends Component
  @defaultProps: {
    type: 'log-notes'
    paddingLeft: 60
    inEditMode: false
    noteComponent: NoteComponent
    noteEditor: NoteTextEditor
    allowPositionEditing: false
    allowCreation: false
  }
  @propTypes: {
    notes: T.arrayOf(NoteShape).isRequired
    width: T.number.isRequired
    paddingLeft: T.number
    onUpdateNote: T.func
    onCreateNote: T.func
    onDeleteNote: T.func
    editingNote: NoteShape
    onEditNote: T.func
    inEditMode: T.bool
    noteComponent: T.elementType
    noteEditor: T.elementType
    allowPositionEditing: T.bool
    forceOptions: T.options
  }
  render: ->
    {width,
     paddingLeft,
     transform,
     notes,
     inEditMode
     onUpdateNote
     onDeleteNote
     onCreateNote
     noteComponent
     noteEditor
     allowPositionEditing
     forceOptions
    } = @props

    editHandler = onUpdateNote
    if not inEditMode
      editHandler = null

    innerWidth = width-paddingLeft

    h NoteLayoutProvider, {
      notes
      width: innerWidth
      paddingLeft
      noteComponent
      forceOptions
    }, [
      h NoteEditorProvider, {
        inEditMode
        noteEditor
        onCreateNote
        onUpdateNote
        onDeleteNote
      }, [
        h 'g.section-log', {transform}, [
          h NoteDefs
          h CancelEditUnderlay
          h NotesList, {
            editHandler
            inEditMode
          }
          h NewNotePositioner
          h NoteEditor, {allowPositionEditing}
        ]
      ]
    ]

StaticNotesColumn = (props)->
  {width,
   paddingLeft,
   transform,
   notes,
   noteComponent
  } = props

  innerWidth = width-paddingLeft

  h NoteLayoutProvider, {
    notes
    width: innerWidth
    paddingLeft
    noteComponent
  }, [
    h 'g.section-log', {transform}, [
      h NoteDefs
      h NotesList, {inEditMode: false}
    ]
  ]

StaticNotesColumn.defaultProps = {
  paddingLeft: 60
  noteComponent: NoteComponent
}

StaticNotesColumn.propTypes = {
  notes: T.arrayOf(NoteShape).isRequired
  width: T.number.isRequired
  paddingLeft: T.number
  noteComponent: T.elementType
}

NotesColumn = (props)->
  {editable, rest...} = props
  c = if editable then EditableNotesColumn else StaticNotesColumn
  h c, rest

NotesColumn.defaultProps = {editable: true}

export {NotesColumn, NoteComponent, NoteTextEditor, NoteEditor}
