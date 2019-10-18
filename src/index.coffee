import h from '~/hyper'
import {StratColumn} from './column'
import {SettingsPanel} from './settings'
import {Component} from 'react'
import {StatefulComponent} from '@macrostrat/ui-components'

import columnData from '~/example-data/Naukluft-Section-J.json'

createID = ->
  '_' + Math.random().toString(36).substr(2, 9)

prepareSurface = (surface, i)->
  surface.id ?= createID()
  try
    surface.top = columnData.surfaces[i+1].bottom
  catch
    surface.top = columnData.height
  return surface

prepareColumnData = (columnData)->
  columnData.height = 60
  columnData.surfaces.sort (a,b)->
    return a.bottom-b.bottom
  console.log columnData
  columnData.surfaces = columnData.surfaces.map prepareSurface
  return columnData




class App extends StatefulComponent
  constructor: (props)->
    super props
    @state = {
      imageURL: null
      columnData: prepareColumnData(columnData)
      inEditMode: true
      generalized: false
      editingInterval: null
      clickedHeight: null
    }

  render: ->
    {generalized, inEditMode, editingInterval, clickedHeight} = @state

    h 'div.app', [
      h StratColumn, {
        data: prepareColumnData(columnData)
        generalized
        inEditMode
        @editInterval
        @addInterval
        @removeInterval
        editingInterval
        clickedHeight
      }
      h SettingsPanel, {
        inEditMode
        generalized
        @updateState
      }
    ]

  updateColumnData: (spec)=>
    @updateState {columnData: spec}

  # Interval management
  editInterval: (obj)=>
    return unless @state.inEditMode
    if not obj?
      return @cancelEditInterval()
    {height, division} = obj
    @updateState {
      editingInterval: {$set: division}
      clickedHeight: {$set: height}
    }

  cancelEditInterval: =>
    @updateState {editingInterval: {$set: null}}


  addInterval: (height)=>
    return unless @props.update?
    {surfaces} = @props.data
    editingInterval = {bottom: height}
    surfaces.push editingInterval
    console.log surfaces
    surfaces.sort (a,b)-> a.bottom-b.bottom
    @props.update {surfaces: {$set: surfaces}}
    @updateState {editingInterval: {$set: editingInterval}}

  removeInterval: (id)=>


export {App}
