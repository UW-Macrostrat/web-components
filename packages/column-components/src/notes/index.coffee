import {findDOMNode} from "react-dom"
import {Component, createElement} from "react"
import h from "react-hyperscript"
import {Node, Renderer, Force} from "labella"
import FlexibleNode from "./flexible-node"
import T from "prop-types"
import {EditableText} from "@blueprintjs/core"
import {ColumnContext} from '../context'
import {Note} from './note'
import NoteDefs from './defs'

class NotesColumn extends Component
  @contextType: ColumnContext
  @defaultProps: {
    type: 'log-notes'
    paddingLeft: 60
    inEditMode: false
  }
  @propTypes: {
    notes: T.arrayOf(T.object)
    width: T.number.isRequired
    paddingLeft: T.number
  }

  notesData: =>
    {scale, pixelHeight: height} = @context
    {width: outerWidth, paddingLeft, notes: data} = @props
    width = outerWidth-paddingLeft

    index = []
    nodes = []

    for note in data
      offsX = 0
      for column in [0..index.length+1]
        sh = parseFloat(note.height)
        index[column] ?= sh
        if index[column] < sh
          if note.has_span
            hy = parseFloat(note.top_height)
          else
            hy = sh
          index[column] = hy
          offsX = column
          break
      note.offsetX = offsX

      txt = note.note or ''
      estimatedTextHeight = ((txt.length//(width/3.8))+1)*16+5
      note.estimatedTextHeight = estimatedTextHeight

    nodes = data.map (note)=>
      pixelHeight = scale(note.height)
      if note.has_span
        end_height = scale(note.top_height)
        harr = [pixelHeight-4,end_height+4]
        if harr[0]-harr[1] > 5
          return new FlexibleNode harr, note.estimatedTextHeight
      return new Node pixelHeight, note.estimatedTextHeight

    force = new Force {
      minPos: 0,
      maxPos: height
    }

    force.nodes(nodes).compute()

    newNodes = force.nodes()

    data.forEach (d,i)->
      d.node = newNodes[i]

    data.reverse()

  render: ->
    {scale, zoom, pixelHeight: height} = @context
    {type, width,
     paddingLeft, transform, notes} = @props

    innerWidth = width-paddingLeft

    notes = @notesData()

    renderer = new Renderer {
      direction: 'right'
      layerGap: paddingLeft
      nodeHeight: 5
    }

    width += 80

    h 'g.section-log', {transform}, [
      h NoteDefs
      h 'g', notes.map (d)=>
        h Note, {
          scale, d, width: innerWidth,
          editHandler: @handleNoteEdit
          link: renderer.generatePath(d.node),
          key: d.id,
          columnGap: paddingLeft
          inEditMode: @props.inEditMode
        }

    ]

  # handleNoteEdit: (noteID, newText)=>
  #   # We can't edit on the frontend
  #   return unless PLATFORM == ELECTRON
  #   {dirname} = require 'path'
  #   baseDir = dirname require.resolve '../..'
  #   if newText.length == 0
  #     sql = storedProcedure('set-note-invisible', {baseDir})
  #     await db.none sql, [noteID]
  #   else
  #     sql = storedProcedure('update-note', {baseDir})
  #     await db.none sql, [noteID, newText]
  #   @updateNotes()
  #   console.log "Note #{noteID} edited"

export {NotesColumn}
