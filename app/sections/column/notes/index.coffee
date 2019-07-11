import {findDOMNode} from "react-dom"
import * as d3 from "d3"
import "d3-selection-multi"
import {Component, createElement} from "react"
import h from "react-hyperscript"
import {db, storedProcedure, query} from "../../db"
import {Node, Renderer, Force} from "labella"
import {calculateSize} from "calculate-size"
import FlexibleNode from "./flexible-node"
import T from "prop-types"
import {EditableText} from "@blueprintjs/core"
import {PhotoOverlay} from "./photo-overlay"
import {ColumnContext} from '../context'

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
    estimatedTextHeight = ((txt.length//(opts.width/3.8))+1)*16+5
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
  @propTypes: {
    inEditMode: T.bool
  }

  constructor: (props)->
    super props
    @state = {overlayIsEnabled: false}

  render: ->
    {scale, style, d} = @props
    extraClasses = ''

    if d.has_span
      height = scale(0)-scale(d.span)
    else
      height = 0

    halfHeight = height/2

    pos = d.node.centerPos or d.node.idealPos

    offsY = d.node.currentPos
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
        transform: "translate(#{x})"
      }
      createElement 'foreignObject', {
        width: @props.width-@props.columnGap-offsX-10
        x: @props.columnGap+x
        y: offsY-d.estimatedTextHeight/2
        height: 100
      }, @createBody()
    ]

  renderEditor: =>
    h EditableText, {
      multiline: true
      className: 'note-label'
      defaultValue: @props.d.note
      onConfirm: (text)=>
        @props.editHandler(@props.d.id, text)
    }

  renderPhotoOverlay: =>
    {photos} = @props.d
    return null unless photos?
    tx = "#{photos.length} photo"
    if photos.length > 1
      tx += 's'

    h [
      h 'a.photos-link', {onClick: @toggleOverlay}, tx
      h PhotoOverlay, {
        isOpen: @state.overlayIsEnabled
        onClose: @toggleOverlay
        photoIDs: photos
      }
    ]

  createBody: =>
    return @renderEditor() if @props.inEditMode

    h 'div', [
      h 'p.note-label', {
        xmlns: "http://www.w3.org/1999/xhtml"
      }, [
        h('span', null, @props.d.note)
        @renderPhotoOverlay()
      ]
    ]

  toggleOverlay: =>
    {overlayIsEnabled} = @state
    @setState overlayIsEnabled: not overlayIsEnabled

  positioningInfo: =>
    console.log @props.d.id

class NotesColumn extends Component
  @contextType: ColumnContext
  @defaultProps: {
    width: 100
    type: 'log-notes'
    columnGap: 60
    inEditMode: false
  }
  @propTypes: {
    id: T.string.isRequired
  }
  constructor: (props)->
    # We define our own scale because we only
    # want to compute the force layout once regardless of zooming

    super props
    @state = {notes: []}
    @updateNotes()

  updateNotes: =>
    {type, id} = @props
    data = await query type, [id]

    @setState {notes: data}

  render: ->
    {scale, zoom, pixelHeight: height} = @context
    {width, columnGap, transform} = @props

    processor = processNotesData({scale, height, width})
    notes = processor(@state.notes)

    renderer = new Renderer {
      direction: 'right'
      layerGap: columnGap
      nodeHeight: 5
    }

    width += 80

    h 'g.section-log', {transform}, [
      h 'defs', [
        arrowMarker 'arrow_start', 270
        arrowMarker 'arrow_end', 90
      ]
      h 'g', notes.map (d)=>
        h Note, {
          scale, d, width,
          editHandler: @handleNoteEdit
          link: renderer.generatePath(d.node),
          key: d.id,
          columnGap
          inEditMode: @props.inEditMode
        }

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

export default NotesColumn
