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
{getSectionData} = require './section-data'
Measure = require('react-measure').default
SectionPanel = require './panel'
PropTypes = require 'prop-types'

class SectionPage extends Component
  constructor: (props)->
    super props
    @state =
      sections: []
      dimensions: {}
      options:
        zoom: 1
        settingsPanelIsActive: false
        inEditMode: false
        modes: [
          {value: 'normal', label: 'Normal'}
          {value: 'skeleton', label: 'Skeleton'}
        ]
        activeMode: 'normal'
        showNotes: true
        dragdealer: false
        condensedDisplay: true
        update: @updateOptions
        sectionIDs: []
        dragPosition: {x: 0, y: 0}

    @optionsStorage = new LocalStorage 'sections-component'
    v = @optionsStorage.get()
    return unless v?
    @state = update @state, options: {$merge: v}

  getChildContext: ->
    inEditMode: @state.options.inEditMode

  @childContextTypes:
    inEditMode: PropTypes.bool

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
      {sections, dimensions, options} = @state
      h SectionPanel, {
        sections, dimensions, options
        updatePosition: (pos)=>
          console.log "Updating drag position"
          @updateOptions dragPosition: {$set: pos}
      }

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
        ids = sections.map (s)->s.id
        @updateOptions sectionIDs: {$set: ids}
        _el = findDOMNode @
        el = select _el
        el.selectAll 'img'
          .on 'load', ->
            console.log "Loaded all images"

    @setupListeners()

  componentDidUpdate: ->
    window.dispatchEvent(new Event('resize'))

  setupListeners: =>
    ipc.on 'zoom-reset', =>
      @updateOptions zoom: {$set: 1}
    ipc.on 'zoom-in', =>
      @updateOptions zoom: {
        $apply: (d)-> if d < 2 then d * 1.25 else d
      }
    ipc.on 'zoom-out',=>
      @updateOptions zoom: {
        $apply: (d)-> if d > 0.05 then d / 1.25 else d
      }

module.exports = SectionPage
