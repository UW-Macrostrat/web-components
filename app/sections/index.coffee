{findDOMNode} = require 'react-dom'
{Component} = require 'react'
require './main.styl'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
ElementPan = require 'react-element-pan'
ipc = require('electron').ipcRenderer
{NavLink} = require '../nav'
{Icon} = require 'react-fa'
SettingsPanel = require './settings'
update = require 'immutability-helper'
LocalStorage = require './storage'
SectionComponent = require './column'
require 'stratigraphic-column/src/main.styl'
{getSectionData} = require 'stratigraphic-column/src/util'
Measure = require('react-measure').default
{Dragdealer} = require 'dragdealer'
require 'dragdealer/src/dragdealer.css'

class SectionPanel extends Component
  # Zoomable panel containing individual sections
  render: ->
    console.log "Rendering section panel"
    console.log @props
    children = @props.sections.map (row)=>
      row.key = row.id # Because react
      row.zoom = @props.options.zoom
      row.skeletal = @props.options.activeMode == 'skeleton'
      row.showNotes = @props.options.showNotes
      h SectionComponent, row

    st = {zoom: @props.options.zoom}
    h 'div.dragdealer#section-page', [
      h 'div#section-page-inner.handle', {style: st }, children
    ]

  componentDidMount: ->
    console.log "Section page mounted"
    _el = findDOMNode @
    console.log Dragdealer
    new Dragdealer _el, {
      x: 0, y: 0,
      loose: true
      vertical: true, requestAnimationFrame: true
      callback: @setPosition}

  setPosition: (x,y)=>
    console.log x,y

class SectionPage extends Component
  constructor: (props)->
    super props
    @state =
      sections: []
      dimensions: {}
      options:
        zoom: 1
        settingsPanelIsActive: false
        modes: [
          {value: 'normal', label: 'Normal'}
          {value: 'skeleton', label: 'Skeleton'}
        ]
        activeMode: 'normal'
        showNotes: true
        update: @updateOptions

    @optionsStorage = new LocalStorage 'sections-component'
    v = @optionsStorage.get()
    return unless v?
    @state = update @state, options: {$merge: v}

  render: ->

    resizeFunc = (contentRect)->
      console.log contentRect
      @setState dimensions: contentRect

    obj =
      bounds: true,
      offset: true,
      scroll: true,
      client: true,
      onResize: resizeFunc


    panel = h Measure, obj, (measureRef)=>
      h SectionPanel, @state

    elements = [
      h 'div#section-pane', [
        h 'ul.controls', [
          h NavLink, to: '/', [h Icon, name: 'home', size: '2x']
          h 'li', [
            h 'a', onClick: @toggleSettings, [
              h Icon, name: 'gear', size: '2x'
            ]
          ]
        ]
        panel
      ]
      h SettingsPanel, @state.options
    ]

    h 'div.page.section-page', elements

  updateOptions: (opts)=>
    newOptions = update @state.options, opts
    @setState options: newOptions
    @optionsStorage.set newOptions

  toggleSettings: =>
    @updateOptions settingsPanelIsActive: {$apply: (d)->not d}

  componentDidMount: ->
    getSectionData()
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
      @updateOptions zoom: {$set: 1}
    ipc.on 'zoom-in', =>
      @updateOptions zoom: {$apply: (d)-> d * 1.25}
    ipc.on 'zoom-out',=>
      @updateOptions zoom: {$apply: (d)-> d / 1.25}

module.exports = SectionPage
