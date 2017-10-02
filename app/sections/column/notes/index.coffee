{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
{db, storedProcedure, query} = require '../../db'
{Node, Renderer, Force} = require 'labella'
{calculateSize} = require 'calculate-size'
FlexibleNode = require './flexible-node'
PropTypes = require 'prop-types'
{EditableText} = require '@blueprintjs/core'

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
        index[column] = hy
        offsX = column
        break
    note.offsetX = offsX

    txt = note.note or ''
    estimatedTextHeight = ((txt.length//(opts.width/3.8))+1)*12+5
    note.estimatedTextHeight = estimatedTextHeight

  nodes = data.map (note)=>
    height = opts.scale note.start_height
    if note.has_span
      end_height = opts.scale note.end_height
      harr = [height-4,end_height+4]
      if harr[0]-harr[1] > 5
        return new FlexibleNode harr, note.estimatedTextHeight
    return new Node height, note.estimatedTextHeight

  force = new Force
    minPos: 0,
    maxPos: opts.height

  force.nodes(nodes).compute()

  newNodes = force.nodes()

  data.forEach (d,i)->
    d.node = newNodes[i]

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
  @defaultProps:
    marginTop: 0
  render: ->
    {scale, style, d, marginTop} = @props
    extraClasses = ''

    if d.has_span
      height = scale(0)-scale(d.span)
    else
      height = 0

    halfHeight = height/2

    pos = d.node.centerPos or d.node.idealPos
    pos += marginTop

    offsY = d.node.currentPos+marginTop
    offsX = d.offsetX or 0

    x = (offsX+1)*5
    h "g.note#{extraClasses}", {
      onMouseOver: @positioningInfo
    }, [
      h NoteSpan, {
        transform: "translate(#{x} #{pos-halfHeight})"
        height
      }
      h 'path.link', {
        d: @props.link
        transform: "translate(#{x} #{marginTop})"
      }
      createElement 'foreignObject', {
        width: @props.width-@props.columnGap-offsX-10
        x: @props.columnGap+x
        y: offsY-d.estimatedTextHeight/2
        height: 100
      }, @createBody()
    ]

  createBody: =>
    if @context.inEditMode
      v = h EditableText, {
        multiline: true
        className: 'note-label'
        defaultValue: @props.d.note
        onConfirm: (text)=>
          @props.editHandler(@props.d.id, text)
      }
    else
      v = h 'p.note-label',
          xmlns: "http://www.w3.org/1999/xhtml"
          @props.d.note
    h 'div', {}, v


  positioningInfo: =>
    console.log @props.d.id

  @contextTypes:
    inEditMode: PropTypes.bool

class NotesColumn extends Component
  @defaultProps:
    width: 100
    type: 'log-notes'
    columnGap: 60
    visible: false
  constructor: (props)->
    # We define our own scale because we only
    # want to compute the force layout once regardless of zooming

    super props
    @state =
      notes: []
    @updateNotes()

  updateNotes: ->
    {height, sectionLimits, width, visible} = @props
    scale = d3.scaleLinear()
      .domain sectionLimits
      .range [height, 0]

    query @props.type, [@props.id]
      .then processNotesData({scale, height, width})
      .then (data)=>
        @setState notes: data

  render: ->
    {width, columnGap, zoom, visible} = @props
    {scale, notes} = @state

    {height, sectionLimits, marginTop} = @props
    scale = d3.scaleLinear()
      .domain sectionLimits
      .range [height, 0]

    renderer = new Renderer
      direction: 'right'
      layerGap: columnGap
      nodeHeight: 5

    nodes = notes.map (d)->d.node

    style = {zoom, marginLeft: -80}
    width += 80

    children = []
    if visible
      children = notes.map (d)=>
        h Note, {
          marginTop
          scale, d, width,
          editHandler: @handleNoteEdit
          link: renderer.generatePath(d.node),
          key: d.id, columnGap}


    h 'svg.section-log', {width, xmlns: "http://www.w3.org/2000/svg", style}, [
      h 'defs', [
        arrowMarker 'arrow_start', 270
        arrowMarker 'arrow_end', 90
      ]
      h 'g', children
    ]

  handleNoteEdit: (noteID, newText)=>
    # We can't edit on the frontend
    return unless PLATFORM == ELECTRON
    {dirname} = require 'path'
    baseDir = dirname require.resolve '../..'
    if newText.length == 0
      sql = storedProcedure('set-note-invisible', {baseDir})
      await db.none sql, [noteID]
    else
      sql = storedProcedure('update-note', {baseDir})
      await db.none sql, [noteID, newText]
    @updateNotes()
    console.log "Note #{noteID} edited"

module.exports = NotesColumn
