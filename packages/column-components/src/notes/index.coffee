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

NoteShape = T.shape {
  height: T.number.isRequired
  note: T.string
  top_height: T.number
  symbol: T.string
}

class NotesColumn extends Component
  @contextType: ColumnContext
  @defaultProps: {
    type: 'log-notes'
    paddingLeft: 60
    inEditMode: false
  }
  @propTypes: {
    notes: T.arrayOf(NoteShape).isRequired
    width: T.number.isRequired
    paddingLeft: T.number
    onUpdateNote: T.func
  }

  notesData: =>
    {scale, pixelHeight: height} = @context
    {width: outerWidth, paddingLeft, notes} = @props
    width = outerWidth-paddingLeft

    index = []
    nodes = []

    # notes must be ordered from bottom up!
    # This is ridiculously non-performant.
    notes.sort (a,b)->a.height-b.height

    console.log notes

    for note in notes
      offsX = 0
      console.log(note)
      note.has_span = note.top_height?

      # Get column that note should render in
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
      estimatedTextHeight = ((txt.length//(width/3.8))+1)*15+5
      note.estimatedTextHeight = estimatedTextHeight

    data = notes.filter (d)->d.note?

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
    {type,
     width,
     paddingLeft,
     transform,
     notes,
     inEditMode
    } = @props

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
      h 'g', notes.map (note)=>
        h Note, {
          note
          scale,
          width: innerWidth,
          editHandler: @handleNoteEdit
          link: renderer.generatePath(note.node),
          key: note.id,
          paddingLeft
          inEditMode
        }

    ]

  handleNoteEdit: (noteID, newText)=>
    @props.editHandler(noteID, newText)

export {NotesColumn}
