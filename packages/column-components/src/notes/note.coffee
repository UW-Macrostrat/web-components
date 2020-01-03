import {findDOMNode} from "react-dom"
import {Component, createElement, useContext, createRef, forwardRef} from "react"
import h from "../hyper"
import T from "prop-types"
import {NoteLayoutContext} from './layout'
import {NoteEditorContext} from './editor'
import {HeightRangeAnnotation} from './height-range'
import {hasSpan} from './utils'
import {ForeignObject} from '../util'
import {NoteShape} from './types'

NoteBody = (props)->
  {note} = props
  {setEditingNote, editingNote} = useContext(NoteEditorContext)
  {noteComponent} = useContext(NoteLayoutContext)
  isEditing = editingNote == note

  onClick = ->
    setEditingNote(note)

  visibility = if isEditing then 'hidden' else 'inherit'
  h noteComponent, {visibility, note, onClick}

NotePositioner = forwardRef (props, ref)->
  {offsetY, noteHeight, children} = props
  {width, paddingLeft} = useContext(NoteLayoutContext)
  noteHeight ?= 0
  outerPad = 5

  h ForeignObject, {
    width: width-paddingLeft+2*outerPad
    x: paddingLeft-outerPad
    y: offsetY-noteHeight/2-outerPad
    height: 1
    style: {overflowY: 'visible'}
  }, [
    h 'div.note-inner', {
      ref,
      style: {margin: '5px', position: 'relative'}
    }, children
  ]

findIndex = (note)->
  {notes} = useContext(NoteLayoutContext)
  notes.indexOf(note)

NoteConnector = (props)->
  {note, node, index} = props
  # Try to avoid scanning for index if we can
  index ?= findIndex(note)
  {nodes, columnIndex, generatePath} = useContext(NoteLayoutContext)
  {height, top_height} = note

  node ?= nodes[note.id]
  offsetX = (columnIndex[index] or 0)*5

  h [
    h HeightRangeAnnotation, {
      offsetX
      height,
      top_height
    }
    h 'path.link', {
      d: generatePath(node, offsetX)
      transform: "translate(#{offsetX})"
    }
  ]

NoteMain = forwardRef (props, ref)->
  {note, offsetY, noteHeight} = props
  {editingNote} = useContext(NoteEditorContext)
  return null if editingNote == note
  h "g.note", [
    h NoteConnector, {note}
    h NotePositioner, {
      offsetY
      noteHeight
      ref
    }, [
      h NoteBody, {note}
    ]
  ]

class Note extends Component
  @propTypes: {
    editable: T.bool
    note: NoteShape.isRequired
    editHandler: T.func
  }
  @contextType: NoteLayoutContext
  constructor: (props)->
    super props
    @element = createRef()
    @state = {height: null}

  render: ->
    {style, note, editHandler, editable} = @props
    {scale, nodes, columnIndex, width, paddingLeft} = @context

    node = nodes[note.id]
    offsetY = scale(note.height)
    if node?
      offsetY = node.currentPos

    noteHeight = (@state.height or 0)

    h NoteMain, {
      offsetY
      note
      noteHeight
      ref: @element
    }

  updateHeight: (prevProps)=>
    node = @element.current
    return unless node?
    height = node.offsetHeight
    return unless height?
    return if prevProps? and prevProps.note == @props.note
    console.log "Updating note height"
    @setState {height}
    @context.registerHeight(@props.note.id, height)

  componentDidMount: =>
    @updateHeight.apply(@,arguments)

  componentDidUpdate: =>
    @updateHeight.apply(@,arguments)

NotesList = (props)->
  {inEditMode: editable, rest...} = props
  editable ?= false
  {notes} = useContext(NoteLayoutContext)
  h 'g', notes.map (note)=>
    h Note, {key: note.id, note, editable, rest...}

export {Note, NotesList, NotePositioner, NoteConnector}
