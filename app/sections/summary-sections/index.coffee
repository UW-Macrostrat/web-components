{findDOMNode} = require 'react-dom'
{Component} = require 'react'
require '../main.styl'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
ElementPan = require 'react-element-pan'
{NavLink} = require '../../nav'
{Icon} = require 'react-fa'
SettingsPanel = require '../settings'
update = require 'immutability-helper'
LocalStorage = require '../storage'
{getSectionData} = require '../section-data'
Measure = require('react-measure').default
{ZoomablePanelContainer} = require '../panel'
{SectionNavigationControl} = require '../util'
PropTypes = require 'prop-types'

class SectionPage extends Component
  constructor: (props)->
    super props
    @state =
      sections: []
      dimensions: {}
      options:
        zoom: 0.25
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
      {sections} = @props
      {dimensions, options} = @state
      h ZoomablePanelContainer, {
        sections, dimensions, options
        updatePosition: (pos)=>
          console.log "Updating drag position"
          @updateOptions dragPosition: {$set: pos}
      }

    backLocation = '/sections'
    {toggleSettings} = @
    elements = [
      h 'div#section-pane', [
        h SectionNavigationControl, {backLocation, toggleSettings}
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

module.exports = SectionPage


