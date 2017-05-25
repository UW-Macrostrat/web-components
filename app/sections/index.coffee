{findDOMNode} = require 'react-dom'
{Component, createElement} = require 'react'
require './sections/main.styl'

ipc = require('electron').ipcRenderer

{SectionComponent} = require 'stratigraphic-column'
{getSectionData} = require 'stratigraphic-column/src/util'

processSection = (row)->
  row.key = row.id # Because react
  createElement SectionComponent, row

class SectionPage extends Component
  constructor: (props)->
    super props
    @state =
      zoom: 1
      sections: []

  render: ->
    props =
      id: 'main'
      style:
        zoom: @state.zoom

    createElement 'div', props, @state.sections

  componentDidMount: ->
    el = findDOMNode @

    getSectionData()
      .map processSection
      .then (sections)=>
        @setState sections: sections

    @setupListeners()

  setupListeners: =>
    ipc.on 'zoom-reset', =>
      @setState zoom: 1
    ipc.on 'zoom-in', =>
      z = @state.zoom * 1.25
      @setState zoom: z
    ipc.on 'zoom-out',=>
      z = @state.zoom / 1.25
      @setState zoom: z

module.exports = SectionPage
