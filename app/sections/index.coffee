{findDOMNode} = require 'react-dom'
{Component} = require 'react'
require './sections/main.styl'
{select} = require 'd3-selection'
h = require 'react-hyperscript'

ipc = require('electron').ipcRenderer

{SectionComponent} = require 'stratigraphic-column'
{getSectionData} = require 'stratigraphic-column/src/util'

processSection = (row)->
  row.key = row.id # Because react
  h SectionComponent, row

class SectionPage extends Component
  constructor: (props)->
    super props
    @state =
      zoom: 1
      sections: []

  render: ->
    props =
      id: 'section-page'
      style:
        zoom: @state.zoom

    h 'div', props, @state.sections

  componentDidMount: ->
    getSectionData()
      .map processSection
      .then (sections)=>
        @setState sections: sections
        _el = findDOMNode @
        el = select _el
        el.selectAll 'img'
          .on 'load', ->
            console.log "Loaded all images"

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
