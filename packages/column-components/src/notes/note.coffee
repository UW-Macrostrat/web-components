import {findDOMNode} from "react-dom"
import {Component, createElement, useContext} from "react"
import h from "react-hyperscript"
import {Node, Renderer, Force} from "labella"
import FlexibleNode from "./flexible-node"
import T from "prop-types"
import {EditableText} from "@blueprintjs/core"
import {ColumnContext, ColumnLayoutContext} from '../context'
import {NoteLayoutContext} from './layout'
import {hasSpan} from './utils'

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

NoteType = {
  height: T.number.isRequired
  top_height: T.number
  note: T.string
}

class Note extends Component
  @propTypes: {
    inEditMode: T.bool
    paddingLeft: T.number.isRequired
    offsetX: T.number
    note: T.shape(NoteType).isRequired
    node: T.object
    height: T.number.isRequired
  }
  @defaultProps: {
    offsetX: 5
  }
  @contextType: ColumnLayoutContext

  render: ->
    {style, note, paddingLeft, node, offsetX, height: noteHeight} = @props
    {scale, width} = @context
    d = note

    if hasSpan(note)
      height = Math.abs(scale(d.top_height)-scale(d.height))
    else
      height = 0

    halfHeight = height/2

    return null unless node?

    pos = node.centerPos or node.idealPos or scale(d.height)

    offsY = node.currentPos
    offsX = offsetX or 0

    x = (offsX+1)*5

    h "g.note", {
      onMouseOver: @positioningInfo
    }, [
      h NoteSpan, {
        transform: "translate(#{x} #{pos-halfHeight})"
        height
      }
      h 'path.link', {
        d: @props.link
        transform: "translate(#{x})"
      }
      createElement 'foreignObject', {
        width: width-paddingLeft-offsX-10
        x: paddingLeft+x
        y: offsY-noteHeight/2
        height: noteHeight
      }, @createBody()
    ]

  renderEditor: =>
    h EditableText, {
      multiline: true
      className: 'note-label'
      defaultValue: @props.note.note
      onConfirm: (text)=>
        @props.editHandler(@props.note.id, text)
    }

  createBody: =>
    return @renderEditor() if @props.inEditMode

    h 'div', [
      h 'p.note-label', {
        xmlns: "http://www.w3.org/1999/xhtml"
      }, [
        h('span', null, @props.note.note)
      ]
    ]

  positioningInfo: =>
    console.log @props.note.id

NotesList = (props)->
  {renderer, rest...} = props
  {notes, nodes, columnIndex, estimatedTextHeight} = useContext(NoteLayoutContext)
  {width} = useContext(ColumnLayoutContext)

  h 'g', notes.map (note, index)=>
    node = nodes[index]
    ix = columnIndex[index]
    offsetX = ix
    link = if node? then renderer.generatePath(node) else null
    h Note, {
      note
      node
      link,
      offsetX,
      key: note.id,
      height: estimatedTextHeight(note, width)
      rest...
    }

export {Note, NotesList}
