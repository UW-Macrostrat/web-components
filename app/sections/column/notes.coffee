{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
{db, storedProcedure} = require '../db'
uuid = require('uuid/v4')
ReactTooltip = require 'react-tooltip'

class NoteSpan extends Component
  render: ->
    h 'svg'

class Note extends Component
  render: ->
    {scale, style, d} = @props
    extraClasses = ''
    if d.text_height == 'NaN'
      extraClasses+='.error'

    pos = scale(d.text_height)

    height = scale(0)-scale(d.span)

    bias = height/2

    spanStyle =
      top: -bias
      height: height or 0
    #spanStyle = {}

    style =
      top: pos+bias


    h "div.note#{extraClasses}", {
      onMouseOver: @positioningInfo
      style }, [
      h 'div.note-span-container', [
        h 'div.note-span', {style: spanStyle}
      ]
      h 'p', d.note
    ]

  positioningInfo: =>
    console.log @props.d

class NotesColumn extends Component
  @defaultProps:
    width: 100
    type: 'log-notes'
  constructor: (props)->
    super props
    @state =
      notes: []

    db.query storedProcedure(@props.type), [@props.id]
      .then (data)=>
        console.log data
        @setState notes: data

  render: ->
    {scale} = @props

    h 'div.section-log', {}, @state.notes.map (d)->
      h Note, {scale, d}

module.exports = NotesColumn
