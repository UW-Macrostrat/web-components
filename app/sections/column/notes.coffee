{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
{db, storedProcedure} = require '../db'
{Node, Renderer, Force} = require 'labella'
{calculateSize} = require 'calculate-size'

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
    {height, transform} = @props
    if height > 0
      el = h 'line', {
       x1: 0, x2: 0, y1: 2.5,
       y2: height-2.5
      }
    else
      el = h 'circle', {r: 2}

    h 'g', transform: transform, el

class Note extends Component
  render: ->
    {scale, style, d} = @props
    extraClasses = ''
    if d.text_height == 'NaN'
      extraClasses+='.error'

    pos = scale(d.text_height)

    if d.has_span
      height = scale(0)-scale(d.span)
    else
      height = 0

    halfHeight = height/2

    if "#{pos}" == 'NaN'
      pos = 0

    h "g.note#{extraClasses}", {
      transform: "translate(0 #{pos})"
      onMouseOver: @positioningInfo
    }, [
      h NoteSpan, {
        transform: "translate(#{(d.offsetX+1)*5} #{-halfHeight})"
        height
      }
      createElement 'foreignObject', {
        width: @props.width
        x: 30
        y: halfHeight-d.estimatedTextHeight/2
        height: 0
      }, h 'p.note-label',
          xmlns: "http://www.w3.org/1999/xhtml"
          d.note
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
        nodes = []

        for note in data
          offsX = 0
          for column in [0..index.length+1]
            sh = parseFloat(note.start_height)
            index[column] ?= sh
            if index[column] <= sh
              hy = parseFloat(note.end_height) or sh
              console.log hy
              index[column] = hy
              note.offsetX = column
              break
          console.log index
          console.log note.offsetX

        nodes = data.map (note)=>
          txt = note.note or ''
          estimatedTextHeight = ((txt.length//60)+1)*9
          note.estimatedTextHeight = estimatedTextHeight

          height = @props.scale note.text_height
          new Node height, estimatedTextHeight

        force = new Force
          minPos: 0,
          maxPos: @props.height

        force.nodes(nodes).compute()

        newNodes = force.nodes()

        data.forEach (d,i)->
          d.node = newNodes[i]

        console.log "Completed force layout"

        @setState notes: data

  render: ->
    {scale, width} = @props

    children = @state.notes.map (d)->
      h Note, {scale, d, width}

    children.push(h 'defs', [
        arrowMarker 'arrow_start', 270
        arrowMarker 'arrow_end', 90
      ])


    h 'svg.section-log', {
      width: "#{width}px"
      xmlns: "http://www.w3.org/2000/svg"
    }, children

module.exports = NotesColumn
