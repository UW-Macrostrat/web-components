import {createContext, useState, useContext} from 'react'
import {ColumnContext, ModelEditorProvider, useModelEditor} from '#'
import {EditableText} from "@blueprintjs/core"
import classNames from 'classnames'
import h from "../hyper"
import T from 'prop-types'
import {NoteShape} from './types'
import {ForeignObject} from '../util'
import {NoteLayoutContext, NoteRect} from './layout'
import {HeightRangeAnnotation} from './height-range'
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

  [editingNote, setState] = useState(null)

  setEditingNote = (val)->
    console.log val
    setState val

  deleteNote = ->
    props.onDeleteNote(editingNote)
    setState(null)

  value = {
    editingNote,
    setEditingNote,
    deleteNote
    inEditMode,
    noteEditor
  }

  ## Model editor provider gives us a nice store
  h NoteEditorContext.Provider, {value}, [
    h ModelEditorProvider, {
      model: editingNote
      onDelete: deleteNote
      onConfirmChanges: props.onUpdateNote
      logUpdates: true
    }, children
  ]

NoteEditorProvider.propTypes = {
  inEditMode: T.bool
  noteEditor: T.elementType.isRequired
  onUpdateNote: T.func.isRequired
  onDeleteNote: T.func.isRequired
}

EditableNoteConnector = (props)->
  {notes, nodes, columnIndex,
   generatePath} = useContext(NoteLayoutContext)
  {note, node, index} = props
  index ?= notes.indexOf(note)
  node ?= nodes[index]
  x = columnIndex[index]*5

  d = generatePath(node, x)

  h [
    h 'path.note-connector', {
      d, transform: "translate(#{x})",
      fill: 'transparent'
    }
    h ForeignObject, {
      width: 30, x, y: 0, height: 1,
      style: {overflowY: 'visible'}
    }, [
      h PositionEditorInner, {note}
    ]
  ]

PointHandle = (props)->
  {height, size, className, rest...} = props
  className = classNames('handle point-handle', className)
  size ?= 10
  h Draggable, {
    position: {x: 0, y: height},
    axis: 'y'
    rest...
  }, [
    h Box, {
      height: size,
      width: size,
      marginLeft: -size/2,
      marginTop: -size/2,
      position: 'absolute'
      className
    }
  ]

PositionEditorInner = (props)->
  {note, margin} = props
  margin ?= 3
  {scaleClamped: scale} = useContext(ColumnContext)
  {updateModel, editedModel: note} = useModelEditor()
  return null unless note?

  noteHasSpan = hasSpan(note)

  bottomHeight = scale(note.height)
  topHeight = bottomHeight
  height = 0
  if noteHasSpan
    topHeight = scale(note.top_height)
    height = Math.abs(topHeight-bottomHeight)

  moveEntireNote = (e, data)->
    {y} = data
    # Set note height
    spec = {height: {$set: scale.invert(y+height)}}
    if noteHasSpan
      # Set note top height
      spec.top_height = {$set: scale.invert(y)}
    updateModel(spec)

  moveTop = (e, data)->
    spec = {top_height: {$set: scale.invert(data.y)}}
    if Math.abs(data.y-bottomHeight) < 2
      spec.top_height = {$set: null}
    updateModel spec

  moveBottom = (e, data)->
    spec = {height: {$set: scale.invert(data.y)}}
    if Math.abs(data.y-topHeight) < 2
      spec.top_height = {$set: null}
    updateModel spec

  h 'div.position-editor', [
    h.if(noteHasSpan) Draggable, {
      position: {x: 0, y: topHeight},
      onDrag: moveEntireNote
      axis: 'y'
    }, [
      h Box, {
        className: 'handle',
        height,
        width: 2*margin,
        marginLeft: -margin, marginTop: -margin, position: 'absolute'}, [
      ]
    ]
    h PointHandle, {
      height: if noteHasSpan then topHeight else topHeight-15
      onDrag: moveTop
      className: classNames('top-handle', {'add-span-handle': not noteHasSpan})
      bounds: {bottom: bottomHeight}
    }
    h PointHandle, {
      height: bottomHeight
      onDrag: moveBottom
      className: 'bottom-handle'
      bounds: if noteHasSpan then {top: topHeight} else null
    }
  ]

NoteEditorUnderlay = ({padding})->
  {width} = useContext(NoteLayoutContext)
  {setEditingNote} = useContext(NoteEditorContext)
  h NoteRect, {
    fill: 'rgba(255,255,255,0.8)'
    style: {pointerEvents: 'none'}
    className: 'underlay'
  }

NoteEditor = (props)->
  {allowPositionEditing} = props
  {editingNote, noteEditor} = useContext(NoteEditorContext)
  {notes, nodes, elementHeights, createNodeForNote} = useContext(NoteLayoutContext)
  {editedModel} = useModelEditor()
  return null unless editingNote?
  index = notes.indexOf(editingNote)
  node = nodes[index]
  return null unless node?
  {id: noteID} = editingNote
  noteHeight = elementHeights[noteID]

  if editedModel? and editedModel.height?
    newNode = createNodeForNote(editedModel, index)
    # Set position of note to current position
    newNode.currentPos = node.currentPos

    pos = newNode.centerPos or newNode.idealPos
    dy = pos-node.currentPos
    if dy > 50
      newNode.currentPos = pos-50
    if dy < -50
      newNode.currentPos = pos+50
    node = newNode

  h 'g.note-editor.note', [
    h NoteEditorUnderlay
    h.if(not allowPositionEditing) NoteConnector, {note: editingNote, index}
    h.if(allowPositionEditing) EditableNoteConnector, {note: editingNote, node}
    h NotePositioner, {offsetY: node.currentPos, noteHeight}, [
      h noteEditor, {
        note: editingNote,
        key: index
      }
    ]
  ]

export {
  NoteEditorProvider,
  NoteEditorContext,
  NoteTextEditor,
  NoteEditor
}
