import {createContext} from 'react'
import {StatefulComponent} from '@macrostrat/ui-components'
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

withinDomain = (scale)-> (d)->
  [start, end] = scale.domain()
  # end height greater than beginning
  end_height = d.top_height or d.height
  return end_height >= start and d.height <= end


class NoteLayoutProvider extends StatefulComponent
  @propTypes: {
    notes: T.arrayOf(NoteShape).isRequired
    width: T.number.isRequired
    paddingLeft: T.number
  }
  @defaultProps: {
    paddingLeft: 60
    estimatedTextHeight: (note, width)->
      txt = note.note or ''
      return 12
  }
  @contextType: ColumnContext
  constructor: (props)->
    super props
    # State is very minimal to start
    @state = {
      notes: [],
      elementHeights: [],
      nodes: []
      @generatePath
    }

  componentDidMount: =>
    @_previousContext = null
    @computeContextValue()

  render: ->
    {children, width} = @props
    h NoteLayoutContext.Provider, {value: @state}, (
      h ColumnLayoutProvider, {width}, children
    )

  computeContextValue: =>
    console.log "Computing context value"
    {width, paddingLeft} = @props
    {elementHeights} = @state
    {pixelHeight, scale} = @context
    # Clamp notes to within scale boundaries
    # (we could turn this off if desired)
    scale = scale.clamp(true)

    forwardedValues = {
      # Forwarded values from column context
      # There may be a more elegant way to do this
      paddingLeft,
      scale
      width
      @registerHeight
      @generatePath
    }

    notes = @props.notes
      .filter (d)->d.note?
      .filter withinDomain(scale)
      .sort (a,b)->a.height-b.height
    columnIndex = notes.map buildColumnIndex()

    # Compute force layout

    renderer = new Renderer {
      direction: 'right'
      layerGap: paddingLeft
      nodeHeight: 5
    }

    @setState {
      notes,
      columnIndex,
      renderer,
      forwardedValues...
    }

  generatePath: (node, pixelOffset)=>
    {paddingLeft} = @props
    renderer = new Renderer {
      direction: 'right'
      layerGap: paddingLeft-pixelOffset
      nodeHeight: 5
    }
    try
      return renderer.generatePath(node)
    catch
      return null

  computeForceLayout: =>
    {notes, nodes, elementHeights} = @state
    {pixelHeight, scale} = @context
    {width, paddingLeft} = @props

    return if elementHeights.length < notes.length
    return if nodes.length != 0
    console.log "Computing force layout for notes column"

    force = new Force {
      minPos: 0,
      maxPos: pixelHeight
    }

    dataNodes = notes.map (note, index)=>
      txt = note.note or ''
      pixelHeight = elementHeights[index]
      lowerHeight = scale(note.height)
      if hasSpan(note)
        upperHeight = scale(note.top_height)
        harr = [lowerHeight-4,upperHeight+4]
        if harr[0]-harr[1] > 5
          return new FlexibleNode harr, pixelHeight
      return new Node lowerHeight, pixelHeight

    force.nodes(dataNodes).compute()
    nodes = force.nodes() or []
    @updateState {nodes: {$set: nodes}}

  registerHeight: (index, height)=>
    return unless height?
    {elementHeights} = @state
    elementHeights[index] = height
    @updateState {elementHeights: {$set: elementHeights}}

  componentDidUpdate: (prevProps)=>
    @computeForceLayout()
    return if @props.notes == prevProps.notes
    return if @context == @_previousContext
    console.log "Updating node grapher"
    @computeContextValue()
    @_previousContext = @context

export {NoteLayoutContext, NoteLayoutProvider}
