import {createContext, useState} from 'react'
import {EditableText} from "@blueprintjs/core"
import h from "../hyper"
import T from 'prop-types'
import {NoteShape} from './types'

NoteEditorContext = createContext({inEditMode: false})

NoteTextEditor = (props)->
  {note} = props
  h EditableText, {
    multiline: true
    className: 'note-label note-editing'
    defaultValue: note.note
    isEditing: true
    onConfirm: (newText)=>
      props.editHandler(newText)
  }

NoteTextEditor.propTypes = {
  editHandler: T.func.isRequired
  note: NoteShape.isRequired
}

NoteEditorProvider = (props)->
  {children, inEditMode, noteEditor} = props
  inEditMode ?= false
  noteEditor ?= NoteTextEditor

  [editingNote, setEditingNote] = useState(null)

  value = {editingNote, setEditingNote, inEditMode, noteEditor}

  h NoteEditorContext.Provider, {value}, children

NoteEditorProvider.propTypes = {
  inEditMode: T.bool
}

export {NoteEditorProvider, NoteEditorContext, NoteTextEditor}
