{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
{db, storedProcedure} = require '../db'
{Node, Renderer, Force} = require 'labella'
{calculateSize} = require 'calculate-size'

processNotesData = (opts)->(data)->
  index = []
  nodes = []

  for note in data
    offsX = 0
    for column in [0..index.length+1]
      sh = parseFloat(note.start_height)
      index[column] ?= sh
      if index[column] < sh
        if note.has_span
          hy = parseFloat(note.end_height)
        else
          hy = sh
        console.log sh, hy
        index[column] = hy
        note.offsetX = column
        break

  nodes = data.map (note)=>
    txt = note.note or ''
    estimatedTextHeight = ((txt.length//60)+1)*10
    note.estimatedTextHeight = estimatedTextHeight

    height = opts.scale note.text_height
    new Node height, estimatedTextHeight

  force = new Force
    minPos: 0,
    maxPos: opts.height

  force.nodes(nodes).compute()

  newNodes = force.nodes()

  data.forEach (d,i)->
    d.node = newNodes[i]

  console.log "Completed force layout"
  data.reverse()


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
    if height > 5
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

    pos = d.node.idealPos

    offsY = d.node.currentPos

    h "g.note#{extraClasses}", {
      onMouseOver: @positioningInfo
      transform: "translate(#{(d.offsetX+1)*5} 0)"
    }, [
      h NoteSpan, {
        transform: "translate(0 #{pos-halfHeight})"
        height
      }
      h 'path.link', {
        d: @props.link
      }
      createElement 'foreignObject', {
        width: @props.width
        x: @props.columnGap
        y: -d.estimatedTextHeight/2+offsY
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
    columnGap: 60
  constructor: (props)->
    super props
    @state =
      notes: []

    db.query storedProcedure(@props.type), [@props.id]
      .then processNotesData(@props)
      .then (data)=>
        @setState notes: data

  render: ->
    {scale, width, columnGap} = @props

    renderer = new Renderer
      direction: 'right'
      layerGap: @props.columnGap
      nodeHeight: 5

    nodes = @state.notes.map (d)->d.node

    children = @state.notes.map (d)->
      h Note, {scale, d, width, link: renderer.generatePath(d.node), columnGap}

    h 'svg.section-log', {width: width, xmlns: "http://www.w3.org/2000/svg"}, [
      h 'defs', [
        arrowMarker 'arrow_start', 270
        arrowMarker 'arrow_end', 90
      ]
      h 'g', {transform: "translate(0 #{@props.marginTop})"}, children
    ]

module.exports = NotesColumn
