{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
{db, storedProcedure} = require '../db'

arrowMarker = (id, orient, sz=2.5)->
  h 'marker', {
    id
    orient
    markerHeight: sz
    markerWidth: sz
    markerUnits: 'strokeWidth'
    refX:"0"
    refY:"0"
    viewBox:"-#{sz} -#{sz} #{sz*2} #{sz*2}"
  }, [
    h 'path', {
      d:"M 0,0 m -#{sz},-#{sz} L #{sz},0 L -#{sz},#{sz} Z"
      fill:"#000000"
    }
  ]

class NoteSpan extends Component
  render: ->
    {style, padding} = @props
    h 'svg.note-span', {style}, [
      h 'defs', [
        arrowMarker 'arrow_start', 270
        arrowMarker 'arrow_end', 90
      ]
      h 'line', {
       x1: 2, x2: 2, y1: 2+padding,
       y2: style.height-2-padding*2
      }
    ]

class Note extends Component
  render: ->
    {scale, style, d} = @props
    extraClasses = ''
    if d.text_height == 'NaN'
      extraClasses+='.error'

    pos = scale(d.text_height)

    height = scale(0)-scale(d.span)

    bias = height/2

    compress = d.offsetX*5
    padding = 0
    spanStyle =
      top: -bias-padding
      height: (height or 0)+padding*2
      width: 40-d.offsetX*5
      left: -40+d.offsetX*5
    #spanStyle = {}

    style =
      top: pos+bias
      width: @props.width


    h "div.note#{extraClasses}", {
      onMouseOver: @positioningInfo
      style }, [
      h 'div.note-span-container', [
        h NoteSpan, {padding, style: spanStyle}
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
        index = []
        offsX = 0
        for note in data
          for column in [0..index.length+1]
            index[column] ?= note.start_height
            if index[column] <= note.start_height
              if note.has_span
                index[column] = note.end_height
              offsX = column
              break
          note.offsetX = offsX
          console.log index

        @setState notes: data

  render: ->
    {scale, width} = @props

    h 'div.section-log', {}, @state.notes.map (d)->
      h Note, {scale, d, width}

module.exports = NotesColumn
