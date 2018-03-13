{findDOMNode} = require 'react-dom'
{Component} = require 'react'
require '../main.styl'
require './main.styl'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
{NavLink} = require '../../nav'
{Icon} = require 'react-fa'
{SummarySectionsSettings} = require './settings'
update = require 'immutability-helper'
LocalStorage = require '../storage'
{getSectionData} = require '../section-data'
{IsotopesComponent} = require './carbon-isotopes'
Measure = require('react-measure').default
{SectionPanel, LocationGroup} = require '../panel'
{BaseSectionPage} = require '../section-page'
{SVGSectionComponent} = require './column'
{SectionNavigationControl} = require '../util'
{SectionLinkOverlay} = require './link-overlay'
PropTypes = require 'prop-types'
{FaciesDescriptionSmall} = require '../facies-descriptions'
{Legend} = require './legend'

sectionOffsets = {
  A: 0
  B: 105
  C: 270
  D: 415
  E: 255
  F: 268
  G: 0
  H: 378
  I: 50
  J: -5
}

groupOrder = [
  'Tsams'
  'Ubisis'
  'Onis'
]

stackGroups = ['AC','BED','GF','HI']

class SummarySections extends Component
  @defaultProps: {
    scrollable: true
  }
  constructor: (props)->
    super props
    @state =
      sections: []
      dimensions: {
        canvas: {width: 100, height: 100}
      }
      sectionPositions: {}
      options:
        settingsPanelIsActive: false
        modes: [
          {value: 'normal', label: 'Normal'}
          {value: 'skeleton', label: 'Skeleton'}
          #{value: 'sequence-stratigraphy', label: 'Sequence Strat.'}
        ]
        showNavigationController: true
        activeMode: 'normal'
        showFacies: true
        showFloodingSurfaces: false
        showLithostratigraphy: true
        showSequenceStratigraphy: true
        showLegend: true
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
    @state = update @state, options: {$merge: v}

  renderSections: ->
    {sections, scrollable} = @props
    {dimensions, options, sectionPositions} = @state
    {dragdealer, dragPosition, rest...} = options
    {showFloodingSurfaces,
     showSequenceStratigraphy,
     showCarbonIsotopes,
     showOxygenIsotopes,
     trackVisibility,
     showFacies,
     showLegend,
     showLithostratigraphy,
     activeMode} = options

    skeletal = activeMode == 'skeleton'

    sectionResize = (key)=>(contentRect)=>
      cset = {}
      cset[key] = {$set: contentRect}
      @mutateState {sectionPositions: cset}

    __sections = sections.map (row)=>
      {offset, rest...} = row
      offset = sectionOffsets[row.id] or offset

      h SVGSectionComponent, {
        zoom: 0.1, key: row.id,
        skeletal,
        showFloodingSurfaces
        showCarbonIsotopes,
        trackVisibility
        showFacies
        onResize: sectionResize(row.id)
        offset
        rest...
      }

    if showCarbonIsotopes or showOxygenIsotopes
      row = sections.find (d)->d.id == 'J'
      {offset, location, rest...} = row
      location = null
      __ = []
      if showCarbonIsotopes
        __.push h IsotopesComponent, {
          zoom: 0.1,
          key: 'carbon-isotopes',
          showFacies
          onResize: sectionResize('carbon-isotopes')
          offset
          location: ""
          rest...
        }

      if showOxygenIsotopes
        __.push h IsotopesComponent, {
          zoom: 0.1,
          system: 'delta18o'
          label: 'δ¹⁸O'
          domain: [-15,0]
          key: 'oxygen-isotopes',
          showFacies
          onResize: sectionResize('oxygen-isotopes')
          offset
          location: ""
          rest...
        }

      __sections.push h LocationGroup, {
        name: 'Chemostratigraphy'
        className: 'chemostratigraphy'
      }, __

    if showLegend
      __sections.push h Legend

    paddingLeft = 30
    marginTop = 50
    overflow = if scrollable then "scroll" else 'inherit'
    {canvas} = @state.dimensions
    h 'div#section-pane', {style: {overflow}}, [
      h SectionPanel, {
        zoom: 0.1,
        onResize: @onCanvasResize
        stackGroups
        groupOrder
        rest...}, __sections
      h SectionLinkOverlay, {skeletal, paddingLeft, canvas...,
                             marginTop,
                             sectionPositions,
                             showLithostratigraphy
                             showSequenceStratigraphy
                             showCarbonIsotopes
                             }
    ]

  render: ->
    {options} = @state
    backLocation = '/sections'
    {toggleSettings} = @
    {showNavigationController} = options

    navigationController = null
    if showNavigationController
      navigationController = h(
        SectionNavigationControl
        {backLocation, toggleSettings})

    h 'div.page.section-page#summary-sections', [
      h 'div.panel-container', [
        navigationController
        @renderSections()
      ]
      h SummarySectionsSettings, options
    ]

  onSectionResize: (key)=>(contentRect)=>
    console.log "Section #{key} was resized", contentRect

    @mutateState {sectionPositions: {"#{key}": {$set: contentRect}}}

  mutateState: (spec)=>
    state = update(@state, spec)
    @setState state

  onCanvasResize: ({bounds})=>
    {width, height} = bounds
    console.log "Canvas was resized", bounds
    @mutateState {dimensions: {canvas: {
      width: {$set: width}
      height: {$set: height}
    }}}

  updateOptions: (opts)=>
    newOptions = update @state.options, opts
    @setState options: newOptions
    @optionsStorage.set newOptions

  toggleSettings: =>
    @updateOptions settingsPanelIsActive: {$apply: (d)->not d}

module.exports = {SummarySections}

