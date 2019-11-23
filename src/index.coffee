import h from '~/hyper'
import {StatefulComponent} from '@macrostrat/ui-components'

import {StratColumn} from './column'
import {SettingsPanel} from './settings'
import {TitleBar, SideMenu} from './nav'
import T from 'prop-types'
import {Page} from './enum'
import {Panel} from './ui'

import defaultColumnData from '~/example-data/Naukluft-Section-J.json'
import testImage from '~/example-data/Naukluft-Section-J.png'

createID = ->
  '_' + Math.random().toString(36).substr(2, 9)

AboutPanel = (props)->
  h Panel, {title: "About", props...}, [
    h 'div', "This is an app"
  ]

class App extends StatefulComponent
  constructor: (props)->
    super props
    preparedData = @prepareColumnData(defaultColumnData)
    @state = {
      columnImage: testImage
      defaultData: preparedData
      columnData:  preparedData
      inEditMode: true
      generalized: false
      editingInterval: null
      editingNote: null
      clickedHeight: null
      currentPage: Page.MAIN
    }

  render: ->
    {
      generalized,
      inEditMode,
      editingInterval,
      editingNote
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
          height
          generalized
          inEditMode
          notes
          @editInterval
          @addInterval
          @removeInterval
          editingInterval
          clickedHeight
          onUpdate: @updateInterval
          hideDetailColumn: currentPage != Page.MAIN
          columnImage: @state.columnImage
          @onUpdateNote
          @onDeleteNote
          @onCreateNote
        }
        h.if(currentPage == Page.SETTINGS) SettingsPanel, {
          inEditMode
          generalized
          onClose: @setPage(Page.SETTINGS)
          resetDemoData: if @isChanged() then @resetDemoData else null
          @updateState
        }
        h.if(currentPage == Page.ABOUT) AboutPanel, {
          onClose: @setPage(Page.ABOUT)
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

    columnData.notes.forEach (d)->
      d.id ?= createID()

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
    surfaces.sort (a,b)-> a.bottom-b.bottom
    @updateState {editingInterval: {$set: editingInterval}}

  removeInterval: (id)=>

  ### Note editing ###
  onUpdateNote: (newNote)=>
    return unless newNote?
    if not newNote.note? or newNote.note == ""
      return
    {notes} = @state.columnData

    newNote.id ?= createID()
    # Updating note
    ix = @getNoteIndex(newNote)

    isEmpty = not newNote.note? or newNote.note == ""

    spec = {}
    if ix != -1
      spec = {[ix]: {$set: newNote}}
    else if not isEmpty
      spec = {$push: [newNote]}

    console.log "Updating notes with spec", spec

    @updateColumnData {notes: spec}


  getNoteIndex: (note)=>
    @state.columnData.notes.findIndex (d)->
      d.id == note.id

  onDeleteNote: (note)=>
    ix = @getNoteIndex(note)
    @updateColumnData {notes: {$splice: [[ix,1]]}}

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
