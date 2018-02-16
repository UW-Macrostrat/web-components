{findDOMNode} = require 'react-dom'
{Component} = require 'react'
require '../main.styl'
require './main.styl'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
ElementPan = require 'react-element-pan'
{NavLink} = require '../../nav'
{Icon} = require 'react-fa'
{SummarySectionsSettings} = require './settings'
update = require 'immutability-helper'
LocalStorage = require '../storage'
{getSectionData} = require '../section-data'
Measure = require('react-measure').default
{SectionPanel} = require '../panel'
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
        activeMode: 'normal'
        showFacies: true
        showFloodingSurfaces: false
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

  render: ->
    {sections} = @props
    {dimensions, options, sectionPositions} = @state
    {dragdealer, dragPosition, rest...} = options
    backLocation = '/sections'
    {toggleSettings} = @
    {showFloodingSurfaces,
     showCarbonIsotopes,
     trackVisibility,
     showFacies,
     showLegend,
     activeMode} = options

    skeletal = activeMode == 'skeleton'

    accum = {}
    sectionResize = (key)=>(contentRect)=>
      accum[key] = {$set: contentRect}
      if Object.keys(accum).length == sections.length
        console.log "Updating state"
        @mutateState {sectionPositions: accum}

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

    if showLegend
      __sections.push h Legend

    paddingLeft = 30
    marginTop = 50
    {canvas} = @state.dimensions
    h 'div.page.section-page#summary-sections', [
      h 'div.panel-container', [
        h SectionNavigationControl, {backLocation, toggleSettings}
        h 'div#section-pane', [
          h SectionPanel, {
            zoom: 0.1,
            onResize: @onCanvasResize
            stackGroups
            groupOrder
            rest...}, __sections
          h SectionLinkOverlay, {skeletal, paddingLeft, canvas...,
                                 marginTop,
                                 sectionPositions}
        ]
      ]
      h SummarySectionsSettings, @state.options
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

module.exports = SummarySections

