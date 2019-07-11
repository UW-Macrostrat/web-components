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
import {Note} from './note'
import NoteDefs from './defs'

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
      h NoteDefs
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

export {NotesColumn}
