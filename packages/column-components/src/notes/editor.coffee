import {createContext, useState, useContext} from 'react'
import {EditableText} from "@blueprintjs/core"
import h from "../hyper"
import T from 'prop-types'
import {NoteShape} from './types'
import {ForeignObject} from '../util'
import {NoteLayoutContext} from './layout'
import Draggable from 'react-draggable'
import {hasSpan} from './utils'

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

  [editingNote, setEditingNote] = useState(null)

  value = {editingNote, setEditingNote, inEditMode, noteEditor}

  h NoteEditorContext.Provider, {value}, children

NoteEditorProvider.propTypes = {
  inEditMode: T.bool
  noteEditor: T.elementType.isRequired
}

PositionEditorInner = (props)->
  {note} = props
  {scale, nodes, columnIndex, width, paddingLeft} = useContext(NoteLayoutContext)

  startHeight = scale(note.height)
  height = 0
  if hasSpan(note)
    height = Math.abs(scale(note.top_height)-startHeight)

    h 'div.position-editor', [
      h Draggable, [
        h 'div', 'I am draggable'
      ]
    ]


NotePositionEditor = (props)->
  {editingNote} = useContext(NoteEditorContext)
  return null unless editingNote

  h ForeignObject, {
    width: 30, x: 0, y: 0, height: 1,
    style: {overflowY: 'visible'}
  }, [
    h PositionEditorInner, {note: editingNote}
  ]

export {NoteEditorProvider, NoteEditorContext, NoteTextEditor, NotePositionEditor}
