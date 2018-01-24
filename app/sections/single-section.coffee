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
{SectionComponent} = require './column'
{ZoomablePanelContainer} = require './panel'
PropTypes = require 'prop-types'
{ Hotkey, Hotkeys, HotkeysTarget } = require "@blueprintjs/core"
{SectionNavigationControl} = require './util'

class SectionPage extends Component
  constructor: (props)->
    super props
    @state =
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

    {section} = @props

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

    backLocation = '/sections'
    {toggleSettings} = @
    h 'div.page.section-page.single-section', [
      h SectionNavigationControl, {backLocation, toggleSettings}
      h 'div#section-pane', [
        h SectionComponent, {
          trackVisibility: false
          section...,
          offsetTop: 0,
          key, skeletal,
          useRelativePositioning: false
          options...
        }
      ]
      h SettingsPanel, @state.options
    ]

  updateOptions: (opts)=>
    newOptions = update @state.options, opts
    @setState options: newOptions
    @optionsStorage.set newOptions

  toggleSettings: =>
    @updateOptions settingsPanelIsActive: {$apply: (d)->not d}

module.exports = SectionPage


