import h from '~/hyper'
import {StratColumn} from './column'
import {SettingsPanel} from './settings'
import {Component} from 'react'
import {StatefulComponent} from '@macrostrat/ui-components'
import {Navbar, Button, Alignment} from '@blueprintjs/core'
import T from 'prop-types'

import defaultColumnData from '~/example-data/Naukluft-Section-J.json'

createID = ->
  '_' + Math.random().toString(36).substr(2, 9)

TitleBar = (props)->
  {toggleSettings} = props
  h Navbar, [
    h Navbar.Group, [
      h Navbar.Heading, "Column builder"
      h Navbar.Divider
      h Button, {
        minimal: true,
        icon: 'settings',
        onClick: toggleSettings
      }, "Settings"
    ]
  ]

TitleBar.propTypes = {
  toggleSettings: T.func
}

Page = Object.freeze {
  MAIN: 'main'
  SETTINGS: 'settings'
  ABOUT: 'about'
}

class App extends StatefulComponent
  constructor: (props)->
    super props
    @state = {
      imageURL: null
      columnData: @prepareColumnData(defaultColumnData)
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


    h 'div.app', [
      h TitleBar, {@toggleSettings}
      h 'div.main', [
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
        }
        h.if(currentPage == Page.SETTINGS) SettingsPanel, {
          inEditMode
          generalized
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
    return unless @state.inEditMode
    if not obj?
      return @cancelEditInterval()
    {height, division} = obj
    @updateState {
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

  toggleSettings: =>
    nextPage = Page.SETTINGS
    if @state.currentPage == Page.SETTINGS
      nextPage = Page.MAIN
    @updateState {currentPage: {$set: nextPage}}


export {App}
