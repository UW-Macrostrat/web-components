import {createContext, useState, useContext} from 'react'
import {ColumnContext, ModelEditorProvider, useModelEditor} from '#'
import {EditableText} from "@blueprintjs/core"
import classNames from 'classnames'
import h from "../hyper"
import T from 'prop-types'
import {NoteShape} from './types'
import {NoteLayoutProvider} from './layout'
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
  {notes} = useContext(NoteLayoutContext)
  inEditMode ?= false

  [editingNote, setState] = useState(null)

  setEditingNote = (val)->
    setState val

  deleteNote = ->
    val = editingNote
    setState(null)
    props.onDeleteNote(val)

  onCreateNote = (pos)->
    {height, top_height} = pos
    val = {height, top_height, note: null, symbol: null}
    setState(val)

  value = {
    editingNote,
    setEditingNote,
    deleteNote
    inEditMode,
    noteEditor
    onCreateNote
  }

  onConfirmChanges = (n)->
    return unless n?
    return unless n.note?
    props.onUpdateNote(n)

  ## Model editor provider gives us a nice store
  h NoteEditorContext.Provider, {value}, [
    h ModelEditorProvider, {
      model: editingNote
      onDelete: deleteNote
      onConfirmChanges
      logUpdates: true
      alwaysConfirm: true
    }, children
  ]

NoteEditorProvider.propTypes = {
  inEditMode: T.bool
  noteEditor: T.elementType.isRequired
  onUpdateNote: T.func.isRequired
  onDeleteNote: T.func.isRequired
}

NoteConnectorPath = (props)->
  {d, offsetX, className} = props
  h 'path', {
    d,
    className
    transform: "translate(#{offsetX})"
    fill: 'transparent'
  }


EditableNoteConnector = (props)->
  {notes, nodes, columnIndex,
   generatePath,
   createNodeForNote} = useContext(NoteLayoutContext)
  {note, node, index} = props
  if note.id?
    node = nodes[note.id]
  node ?= createNodeForNote(note)
  x = columnIndex[note.id]*5 or 0

  d = generatePath(node, x)

  h [
    h NoteConnectorPath, {
      className: 'note-connector'
      d, offsetX: x
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
  {noteEditor} = useContext(NoteEditorContext)
  {notes, nodes, elementHeights, createNodeForNote} = useContext(NoteLayoutContext)
  {editedModel} = useModelEditor()
  return null unless editedModel?
  index = notes.indexOf(editedModel)
  {id: noteID} = editedModel
  node = nodes[noteID] or createNodeForNote(editedModel)
  noteHeight = elementHeights[noteID] or 20

  if editedModel.height?
    newNode = createNodeForNote(editedModel)
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
    h.if(not allowPositionEditing) NoteConnector, {note: editedModel}
    h.if(allowPositionEditing) EditableNoteConnector, {note: editedModel, node}
    h NotePositioner, {offsetY: node.currentPos, noteHeight}, [
      h noteEditor, {
        note: editedModel,
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
