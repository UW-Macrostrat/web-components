{findDOMNode} = require 'react-dom'
{Component} = require 'react'
require './main.styl'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
ElementPan = require 'react-element-pan'
{NavLink} = require '../nav'
{Icon} = require 'react-fa'
{SettingsPanel} = require './settings'
update = require 'immutability-helper'
LocalStorage = require './storage'
{getSectionData} = require './section-data'
Measure = require('react-measure').default
{SectionComponent} = require './column'
{ZoomablePanelContainer} = require './panel'
PropTypes = require 'prop-types'
{ Hotkey, Hotkeys, HotkeysTarget } = require "@blueprintjs/core"
{SectionNavigationControl} = require './util'
{Intent} = require '@blueprintjs/core'
{Notification} = require '../notify'
d3 = require 'd3'
fmt = d3.format('.1f')

class SectionPage extends Component
  constructor: (props)->
    super props
    @state =
      notificationSent: false
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
        displayModes: [
          {value: 'image', label: 'Full-resolution'}
          {value: 'generalized', label: 'Generalized'}
        ]
        activeDisplayMode: 'image'
        showNotes: true
        showSymbols: true
        showFacies: true
        showFloodingSurfaces: false
        # Allows us to test the serialized query mode
        # we are developing for the web
        serializedQueries: global.SERIALIZED_QUERIES
        dragdealer: false
        condensedDisplay: true
        update: @updateOptions
        sectionIDs: []
        showCarbonIsotopes: false
        dragPosition: {x: 500, y: 500}

    @optionsStorage = new LocalStorage 'sections-component'
    v = @optionsStorage.get()
    return unless v?
    @state = update @state, options: {$merge: v}

  getChildContext: ->
    inEditMode: @state.options.inEditMode

  @childContextTypes:
    inEditMode: PropTypes.bool

  render: ->
    console.log @props, @state

    resizeFunc = (contentRect)->
      @setState dimensions: contentRect

    {section, height} = @props
    {inEditMode} = @state.options

    scrollToHeight = height

    # Set up routing to jump to a specific height
    obj =
      bounds: true,
      offset: true,
      scroll: true,
      client: true,
      onResize: resizeFunc

    key = section.id # Because react
    skeletal = @state.options.activeMode == 'skeleton'
    {options} = @state
    options.zoom = 1

    {toggleSettings} = @
    h 'div.page.section-page.single-section', [
      h 'div.panel-container', [
        h SectionNavigationControl, {toggleSettings}
        h 'div#section-pane', {ref: (p)=>@pane = p}, [
          h SectionComponent, {
            trackVisibility: false
            section...,
            offsetTop: 0
            onResize: @onResize
            key, skeletal,
            isEditable: inEditMode
            useRelativePositioning: false
            options...
          }
        ]
      ]
      h SettingsPanel, @state.options
    ]

  updateOptions: (opts)=>
    newOptions = update @state.options, opts
    @setState options: newOptions
    @optionsStorage.set newOptions

  toggleSettings: =>
    @updateOptions settingsPanelIsActive: {$apply: (d)->not d}

  onResize: ({bounds, scale, padding})=>
    {height, section} = @props
    return unless height
    console.log "Setting scroll position"
    @pane.scrollTop = scale(height)-window.innerHeight/2
    return if @state.notificationSent
    Notification.show {
      message: "Section #{section.id} @ #{fmt(height)} m"
      intent: Intent.PRIMARY
    }
    @setState {notificationSent: true}


module.exports = SectionPage


