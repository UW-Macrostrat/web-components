import {findDOMNode} from "react-dom"
import {Component, createElement, useContext, createRef, forwardRef} from "react"
import h from "react-hyperscript"
import T from "prop-types"
import {EditableText} from "@blueprintjs/core"
import {NoteLayoutContext} from './layout'
import {hasSpan} from './utils'
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

ForeignObject = (props)->
  createElement 'foreignObject', props

NoteEditor = forwardRef (props, ref)->
  {text} = props
  h EditableText, {
    multiline: true
    className: 'note-label'
    defaultValue: text
    ref
    onConfirm: (newText)=>
      @props.editHandler(newText)
  }

NoteBody = forwardRef (props, ref)->
  {text, editable} = props
  editable ?= false
  if editable
    return h(NoteEditor, {ref, props...})
  h 'p.note-label', {
    ref
    xmlns: "http://www.w3.org/1999/xhtml"
  }, [
    h('span', null, text)
  ]

class Note extends Component
  @propTypes: {
    inEditMode: T.bool
    note: NoteShape.isRequired
    index: T.number.isRequired
  }
  @defaultProps: {
    offsetX: 5
  }
  @contextType: NoteLayoutContext
  constructor: (props)->
    super props
    @element = createRef()
    @state = {height: null}

  render: ->
    {style, note, index} = @props
    {scale, nodes, columnIndex, width, estimatedTextHeight, renderer, paddingLeft} = @context

    startHeight = scale(note.height)
    if hasSpan(note)
      height = Math.abs(scale(note.top_height)-startHeight)
    else
      height = 0

    node = nodes[index]
    offsetX = columnIndex[index]

    noteHeight = estimatedTextHeight(note, width)

    try
      link = renderer.generatePath(node)
    catch
      link = null

    pos = 0
    offsY = startHeight
    if node?
      pos = node.centerPos or node.idealPos
      offsY = node.currentPos
    offsX = offsetX or 0

    x = (offsX+1)*5

    h "g.note", [
      h NoteSpan, {
        transform: "translate(#{x} #{pos-height/2})"
        height
      }
      h 'path.link', {
        d: link
        transform: "translate(#{x})"
      }
      h ForeignObject, {
        width: width-paddingLeft-offsX-10
        x: paddingLeft+x
        y: offsY-noteHeight/2
        height: noteHeight
      }, [
        h 'div', [
          h NoteBody, {
            ref: @element
            editable: false,
            editHandler: @props.editHandler,
            text: @props.note.note
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
