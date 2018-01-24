{findDOMNode} = require 'react-dom'
{Component} = require 'react'
require './main.styl'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
ElementPan = require 'react-element-pan'
{NavLink} = require '../nav'
{Icon} = require 'react-fa'
SettingsPanel = require './settings'
update = require 'immutability-helper'
LocalStorage = require './storage'
{getSectionData} = require './section-data'
Measure = require('react-measure').default
{ZoomablePanelContainer} = require './panel'
PropTypes = require 'prop-types'
{SectionComponent} = require './column'
{ Hotkey, Hotkeys, HotkeysTarget } = require "@blueprintjs/core"

class BaseSectionPage extends Component
  constructor: (props)->
    super props

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
          #{value: 'sequence-stratigraphy', label: 'Sequence Strat.'}
        ]
        activeMode: 'normal'
        showNotes: true
        showFloodingSurfaces: false
        # Allows us to test the serialized query mode
        # we are developing for the web
        serializedQueries: global.SERIALIZED_QUERIES
        dragdealer: false
        condensedDisplay: true
        update: @updateOptions
        sectionIDs: []
        showCarbonIsotopes: false
        trackVisibility: true
        dragPosition: {x: 500, y: 500}

    @optionsStorage = new LocalStorage 'sections-component'
    v = @optionsStorage.get()
    return unless v?
    @state = update @state, options: {$merge: v}

  getChildContext: ->
    inEditMode: @state.options.inEditMode
    trackVisibility: @state.options.trackVisibility

  @childContextTypes:
    inEditMode: PropTypes.bool
    trackVisibility: PropTypes.bool

  createSectionElement: (row)=>
    opts = @props.options
    row.key = row.id # Because react
    row.zoom = opts.zoom
    row.skeletal = opts.activeMode == 'skeleton'
    row.showNotes = opts.showNotes
    row.showFloodingSurfaces = opts.showFloodingSurfaces
    row.showCarbonIsotopes = opts.showCarbonIsotopes
    row.trackVisibility = opts.trackVisibility
    h SectionComponent, row

  render: ->

    resizeFunc = (contentRect)->
      @setState dimensions: contentRect

    obj =
      bounds: true,
      offset: true,
      scroll: true,
      client: true,
      onResize: resizeFunc

    panel = h Measure, obj, (measureRef)=>
      {sections, dimensions, options} = @state
      h ZoomablePanelContainer, {
        dimensions, options
        updatePosition: (pos)=>
          console.log "Updating drag position"
          @updateOptions dragPosition: {$set: pos}
      }, sections.map @createSectionElement

    elements = [
      h 'div#section-pane', [
        h 'ul.controls', [
          h NavLink, to: '/sections', [h Icon, name: 'arrow-left', size: '2x']
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

  getInitialData: ->
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

  componentDidMount: ->
    @getInitialData()

  componentDidUpdate: (prevProps, prevState)->
    window.dispatchEvent(new Event('resize'))
    {serializedQueries} = @state.options

    if prevState.options.serializedQueries != serializedQueries
      global.SERIALIZED_QUERIES = serializedQueries
      console.log "Changed SERIALIZED_QUERIES to #{serializedQueries}"
      @getInitialData()

  zoomIn: =>
    @updateOptions zoom: {
      $apply: (d)-> if d < 2 then d * 1.25 else d
    }

  zoomOut: =>
    @updateOptions zoom: {
      $apply: (d)-> if d > 0.05 then d / 1.25 else d
    }

  zoomReset: =>
    @updateOptions zoom: {$set: 1}

  renderHotkeys: ->
    h Hotkeys, [
      h Hotkey, {
        global: true
        combo: "-"
        label: "Zoom out"
        onKeyDown: @zoomOut
      }
      h Hotkey, {
        global: true
        combo: "="
        label: "Zoom in"
        onKeyDown: @zoomIn
      }
      h Hotkey, {
        global: true
        combo: "0"
        label: "Reset zoom"
        onKeyDown: @zoomReset
      }
    ]

HotkeysTarget SectionPage

module.exports = {BaseSectionPage, SectionPage}

