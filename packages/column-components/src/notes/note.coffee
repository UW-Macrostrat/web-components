import {findDOMNode} from "react-dom"
import {Component, createElement, useContext, createRef, forwardRef} from "react"
import h from "@macrostrat/hyper"
import T from "prop-types"
import {NoteLayoutContext} from './layout'
import {hasSpan} from './utils'
import {ForeignObject} from '../util'
import {NoteShape} from './types'

class NoteSpan extends Component
  render: ->
    {height, transform} = @props
    if height > 5
      el = h 'line', {
       x1: 0, x2: 0, y1: 2.5,
       y2: height-2.5
      }
    else
      el = h 'circle', {r: 2}
    h 'g', {transform}, el

class Note extends Component
  @propTypes: {
    inEditMode: T.bool
    note: NoteShape.isRequired
    index: T.number.isRequired
    editHandler: T.func
  }
  @contextType: NoteLayoutContext
  constructor: (props)->
    super props
    @element = createRef()
    @state = {height: null}

  render: ->
    {style, note, index, editHandler} = @props
    {scale, nodes, columnIndex, width, paddingLeft, noteComponent} = @context

    startHeight = scale(note.height)
    height = 0
    if hasSpan(note)
      height = Math.abs(scale(note.top_height)-startHeight)

    node = nodes[index]
    offsetX = (columnIndex[index] or 0)*5

    pos = 0
    offsY = startHeight
    if node?
      pos = node.centerPos or node.idealPos
      offsY = node.currentPos

    noteHeight = (@state.height or 0)


    h "g.note", [
      h NoteSpan, {
        transform: "translate(#{offsetX} #{pos-height/2})"
        height
      }
      h 'path.link', {
        d: @context.generatePath(node, offsetX)
        transform: "translate(#{offsetX})"
      }
      h ForeignObject, {
        width: width-paddingLeft
        x: paddingLeft
        y: offsY-noteHeight/2
        height: noteHeight+10
      }, [
        h 'div.note-inner', {ref: @element}, [
          h noteComponent, {
            editable: @props.inEditMode,
            editHandler
            note
          }
        ]
      ]
    ]

  componentDidMount: =>
    node = @element.current
    return unless node?
    height = node.offsetHeight
    return unless height?
    return if @state.height == height
    console.log height
    @setState {height}
    @context.registerHeight(@props.index, height)

NotesList = (props)->
  {notes} = useContext(NoteLayoutContext)
  h 'g', notes.map (note, index)=>
    h Note, {note, index, props...}

export {Note, NotesList}
