import {createContext, useState, useContext} from 'react'
import {ColumnContext} from '#'
import {EditableText} from "@blueprintjs/core"
import h from "../hyper"
import T from 'prop-types'
import {NoteShape} from './types'
import {ForeignObject} from '../util'
import {NoteLayoutContext} from './layout'
import {NotePositioner, NoteConnector} from './note'
import Draggable from 'react-draggable'
import {hasSpan} from './utils'
import Box from 'ui-box'

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

EditableNoteConnector = (props)->
  {notes, nodes, columnIndex, generatePath} = useContext(NoteLayoutContext)
  {note, node, index} = props
  index ?= notes.indexOf(note)
  node ?= nodes[index]
  x = columnIndex[index]*5
  d = generatePath(node, x)

  h [
    h 'path', {
      d, strokeWidth: 3, transform: "translate(#{x})",
      fill: 'transparent', stroke: '#ccc'
    }
    h ForeignObject, {
      width: 30, x, y: 0, height: 1,
      style: {overflowY: 'visible'}
    }, [
      h PositionEditorInner, {note}
    ]
  ]

PositionEditorInner = (props)->
  {note, margin} = props
  margin ?= 3
  {scale, nodes, columnIndex, width, paddingLeft} = useContext(NoteLayoutContext)

  bottomHeight = scale(note.height)
  topHeight = bottomHeight
  height = 0
  if hasSpan(note)
    topHeight = scale(note.top_height)
    height = Math.abs(topHeight-bottomHeight)

  h 'div.position-editor', [
    h Draggable, {position: {x: -margin, y: topHeight}, axis: 'y'}, [
      h Box, {className: 'handle', height: height+margin, width: 2*margin}, [
        h Draggable, {position: {x: -2, y: -4}, axis: 'y'}, [
          h 'div.handle.top-handle'
        ]
        h Draggable, {position: {x: -2, y: height-14}, axis: 'y'}, [
          h 'div.handle.bottom-handle'
        ]
      ]
    ]
  ]

NoteEditorUnderlay = ({padding})->
  padding ?= 5
  {width} = useContext(NoteLayoutContext)
  {pixelHeight} = useContext(ColumnContext)
  {setEditingNote} = useContext(NoteEditorContext)
  h 'rect.underlay', {
    width: width+2*padding
    height: pixelHeight
    fill: 'rgba(255,255,255,0.8)'
    transform: "translate(#{-padding},#{-padding})"
    style: {pointerEvents: 'none'}
  }



NoteEditor = (props)->
  {allowPositionEditing} = props
  {editingNote, noteEditor} = useContext(NoteEditorContext)
  {notes, nodes, elementHeights} = useContext(NoteLayoutContext)
  return null unless editingNote?
  index = notes.indexOf(editingNote)
  node = nodes[index]
  noteHeight = elementHeights[index]

  h 'g.note-editor.note', [
    h NoteEditorUnderlay
    h.if(not allowPositionEditing) NoteConnector, {note: editingNote, index}
    h.if(allowPositionEditing) EditableNoteConnector, {note: editingNote}
    h NotePositioner, {offsetY: node.currentPos, noteHeight}, [
      h noteEditor, {note: editingNote, key: index}
    ]
  ]

export {
  NoteEditorProvider,
  NoteEditorContext,
  NoteTextEditor,
  NoteEditor
}
