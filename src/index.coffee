import h from '~/hyper'
import {StatefulComponent} from '@macrostrat/ui-components'

import {StratColumn} from './column'
import {SettingsPanel} from './settings'
import {TitleBar, SideMenu} from './nav'
import T from 'prop-types'
import {Page} from './enum'

import defaultColumnData from '~/example-data/Naukluft-Section-J.json'
import testImage from '~/example-data/Naukluft-Section-J.png'

createID = ->
  '_' + Math.random().toString(36).substr(2, 9)

class App extends StatefulComponent
  constructor: (props)->
    super props
    @defaultData = @prepareColumnData(defaultColumnData)
    @state = {
      columnImage: testImage
      columnData: @defaultData
      inEditMode: true
      generalized: false
      editingInterval: null
      clickedHeight: null
      currentPage: Page.MAIN
    }

  render: ->
    {
      generalized,
      inEditMode,
      editingInterval,
      clickedHeight,
      columnData,
      currentPage
    } = @state
    {surfaces, notes, height} = columnData

    if not inEditMode or currentPage == Page.SETTINGS
      editingInterval = null

    h 'div.app', [
      h 'div.main', [
        h SideMenu, {@setPage, currentPage}
        h StratColumn, {
          surfaces
          notes
          height
          generalized
          inEditMode
          @editInterval
          @addInterval
          @removeInterval
          editingInterval
          clickedHeight
          onUpdate: @updateInterval
          hideDetailColumn: currentPage != Page.MAIN
          columnImage: @state.columnImage
        }
        h.if(currentPage == Page.SETTINGS) SettingsPanel, {
          inEditMode
          generalized
          onClose: @setPage(Page.SETTINGS)
          resetDemoData: if @isChanged() then @resetDemoData else null
          @updateState
        }
      ]
    ]

  prepareSurface: (totalHeight)-> (surface, i, allSurfaces)->
    surface.id ?= createID()
    try
      surface.top = allSurfaces[i+1].bottom
    catch
      surface.top = totalHeight
    return surface

  prepareColumnData: (columnData)->
    columnData.height = 60
    columnData.surfaces.sort (a,b)->
      return a.bottom-b.bottom
    v = columnData.surfaces.map @prepareSurface(columnData.height)
    columnData.surfaces = v
    return columnData

  updateColumnData: (spec)=>
    @updateState {columnData: spec}

  # Interval management
  editInterval: (obj)=>
    console.log "Edit interval"
    return unless @state.inEditMode
    if not obj?
      return @cancelEditInterval()
    {height, division} = obj
    if division == @state.editingInterval
      division = null

    @updateState {
      currentPage: {$set: Page.MAIN}
      editingInterval: {$set: division}
      clickedHeight: {$set: height}
    }

  surfaceIndex: (id)=>
    s = @state.columnData.surfaces
    s.findIndex (d)->d.id == id

  updateInterval: (interval, newItems)=>
    {id} = interval
    ix = @surfaceIndex(id)
    surface = @state.columnData.surfaces[ix]
    spec = {}
    for k,v of newItems
      continue if surface[k] == v
      spec[k] = {$set: v}
    console.log ix, spec
    @updateState {
      columnData: {surfaces: {[ix]: spec}}
      editingInterval: spec
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
    @updateState {editingInterval: {$set: editingInterval}}

  removeInterval: (id)=>

  ### Note editing ###
  updateNote: (noteID, newText)=>
    console.log arguments

  setPage: (nextPage)=> =>
    if @state.currentPage == nextPage
      nextPage = Page.MAIN
    @updateState {currentPage: {$set: nextPage}}

  isChanged: =>
    return @state.columnData != @defaultData \
        or @state.columnImage != testImage

  resetDemoData: =>
    @updateState {
      columnData: {$set: @defaultData}
      columnImage: {$set: testImage}
      editingInterval: {$set: null}
    }


export {App}
