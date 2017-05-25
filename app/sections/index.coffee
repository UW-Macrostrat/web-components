{findDOMNode} = require 'react-dom'
{Component, createElement} = require 'react'
loadSections = require 'sections'
require 'sections/main.styl'

ipc = require('electron').ipcRenderer

class SectionPage extends Component
  constructor: (props)->
    super props
    @state =
      zoom: 1

  render: ->
    createElement 'div',
      id: 'main'
      style:
        zoom: @state.zoom

  componentDidMount: ->
    el = findDOMNode @
    loadSections el
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
