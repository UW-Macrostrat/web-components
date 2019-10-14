import {findDOMNode} from "react-dom"
import {Component, createElement} from "react"
import h from "react-hyperscript"
import {Node, Renderer, Force} from "labella"
import FlexibleNode from "./flexible-node"
import T from "prop-types"
import {EditableText} from "@blueprintjs/core"
import {ColumnContext} from '../context'

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
  estimatedTextHeight: T.number.isRequired
}

class Note extends Component
  @propTypes: {
    inEditMode: T.bool
    paddingLeft: T.number.isRequired
    note: T.shape(NoteType).isRequired
  }

  render: ->
    {scale, style, note, paddingLeft} = @props
    d = note

    if d.has_span
      height = Math.abs(scale(d.top_height)-scale(d.height))
    else
      height = 0

    halfHeight = height/2

    pos = d.node.centerPos or d.node.idealPos

    offsY = d.node.currentPos
    offsX = d.offsetX or 0

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
        width: @props.width-paddingLeft-offsX-10
        x: paddingLeft+x
        y: offsY-note.estimatedTextHeight/2
        height: note.estimatedTextHeight
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

export {Note}
