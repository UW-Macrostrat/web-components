import {Component, createContext} from 'react'
import h from '@macrostrat/hyper'
import {NoteShape} from './types'
import {ColumnLayoutProvider, ColumnContext} from '../context'
import T from 'prop-types'
import {hasSpan} from './utils'
import {Node, Renderer, Force} from "labella"
import FlexibleNode from "./flexible-node"

NoteLayoutContext = createContext()

buildColumnIndex = ->
  ###
  # Find out where on the X axis arrows,
  # etc. should plot to aviod overlaps
  ###
  heightTracker = []
  return (note)->
    colIx = 0
    # Get column that note should render in
    nPossibleCols = heightTracker.length+1
    for column in [0..nPossibleCols]
      heightTracker[column] ?= note.height
      if heightTracker[column] < note.height
        hy = note.top_height or note.height
        heightTracker[column] = hy
        colIx = column
        break
    return colIx


class NoteLayoutProvider extends Component
  @propTypes: {
    notes: T.arrayOf(NoteShape).isRequired
    width: T.number.isRequired
    estimatedTextHeight: T.func
  }
  @defaultProps: {
    estimatedTextHeight: (note, width)->
      txt = note.note or ''
      return ((txt.length//(width/3.8))+1)*15+5
  }
  @contextType: ColumnContext
  constructor: (props)->
    super props
    @state = @contextValue()

  componentDidMount: =>
    @_previousContext = null
    @setState @contextValue()

  render: ->
    {children, width} = @props
    h NoteLayoutContext.Provider, {value: @state}, (
      h ColumnLayoutProvider, {width}, children
    )

  computeDerivedState: =>
    {estimatedTextHeight, width} = @props
    notes = @props.notes
      .filter (d)->d.note?
      .sort (a,b)->a.height-b.height
    columnIndex = notes.map buildColumnIndex()
    # Compute force layout
    if @context?
      console.log "Computing force layout"
      {pixelHeight, scale} = @context
      force = new Force {
        minPos: 0,
        maxPos: pixelHeight
      }

      dataNodes = notes.map (note)=>
        txt = note.note or ''
        pixelHeight = estimatedTextHeight(note, width)
        lowerHeight = scale(note.height)
        if hasSpan(note)
          upperHeight = scale(note.top_height)
          harr = [lowerHeight-4,upperHeight+4]
          if harr[0]-harr[1] > 5
            return new FlexibleNode harr, pixelHeight
        return new Node lowerHeight, pixelHeight

      force.nodes(dataNodes).compute()
      nodes = force.nodes()
    nodes ?= []

    return {notes, columnIndex, nodes, estimatedTextHeight}

  contextValue: =>
    return @computeDerivedState()

  componentDidUpdate: (prevProps)=>
    return if @props.notes == prevProps.notes
    return if @context == @_previousContext
    @setState @contextValue()
    console.log "Updating node grapher"
    @_previousContext = @context

export {NoteLayoutContext, NoteLayoutProvider}
