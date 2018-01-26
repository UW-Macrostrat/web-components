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
{SectionPanel} = require '../panel'
{BaseSectionPage} = require '../section-page'
{SVGSectionComponent} = require '../column'
{SectionNavigationControl} = require '../util'
PropTypes = require 'prop-types'

class SummarySections extends Component
  constructor: (props)->
    super props
    @state =
      sections: []
      dimensions: {}
      options:
        settingsPanelIsActive: false
        modes: [
          {value: 'normal', label: 'Normal'}
          {value: 'skeleton', label: 'Skeleton'}
          #{value: 'sequence-stratigraphy', label: 'Sequence Strat.'}
        ]
        activeMode: 'normal'
        showNotes: false
        showFloodingSurfaces: false
        # Allows us to test the serialized query mode
        # we are developing for the web
        serializedQueries: global.SERIALIZED_QUERIES
        condensedDisplay: true
        update: @updateOptions
        sectionIDs: []
        showCarbonIsotopes: false

    @optionsStorage = new LocalStorage 'summary-sections'
    v = @optionsStorage.get()
    return unless v?

  render: ->
    {sections} = @props
    {dimensions, options} = @state
    {dragdealer, dragPosition, rest...} = options
    backLocation = '/sections'
    {toggleSettings} = @

    opts = @state.options
    __sections = sections.map (row)=>
      skeletal = opts.activeMode == 'skeleton'
      {showFloodingSurfaces, showCarbonIsotopes, trackVisibility} = opts

      h SVGSectionComponent, {
        zoom: 0.1, key: row.id,
        skeletal,
        showFloodingSurfaces
        showCarbonIsotopes,
        trackVisibility
        row...
      }

    h 'div.page.section-page', [
      h 'div.panel-container', [
        h SectionNavigationControl, {backLocation, toggleSettings}
        h 'div#section-pane', [
          h SectionPanel, {zoom: 0.1, rest...}, __sections
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

module.exports = SummarySections

