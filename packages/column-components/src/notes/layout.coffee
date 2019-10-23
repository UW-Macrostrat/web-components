import {Component, createContext} from 'react'
import h from '@macrostrat/hyper'
import {NoteShape} from './types'
import {ColumnLayoutProvider} from '../context'
import T from 'prop-types'

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
  }
  constructor: (props)->
    super props
    @state = @contextValue()

  render: ->
    {children, width} = @props
    h NoteLayoutContext.Provider, {value: @state}, (
      h ColumnLayoutProvider, {width}, children
    )

  computeDerivedState: =>
    notes = @props.notes
      .slice()
      .sort (a,b)->a.height-b.height
    columnIndex = notes.map buildColumnIndex()
    return {notes, columnIndex}

  contextValue: =>
    return @computeDerivedState()

  componentDidUpdate: (prevProps)->
    if @props.notes != prevProps.notes
      @setState @contextValue()

export {NoteLayoutContext, NoteLayoutProvider}
