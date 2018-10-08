{findDOMNode} = require 'react-dom'
{Component, createContext} = require 'react'
h = require 'react-hyperscript'
{Icon} = require 'react-fa'
{select} = require 'd3-selection'
PropTypes = require 'prop-types'
{join} = require 'path'
d3 = require 'd3'
update = require 'immutability-helper'
Measure = require('react-measure').default
{debounce} = require 'underscore'

{SummarySections} = require '../summary-sections'
{SummarySectionsSettings} = require '../summary-sections/settings'
LocalStorage = require '../storage'
{getSectionData} = require '../section-data'
{IsotopesComponent} = require '../summary-sections/carbon-isotopes'
{GeneralizedSVGSection} = require './column'
{SectionNavigationControl} = require '../util'
{SectionLinkOverlay} = require '../summary-sections/link-overlay'
{FaciesDescriptionSmall} = require '../facies-descriptions'
{Legend} = require '../summary-sections/legend'
{LithostratKey} = require '../summary-sections/lithostrat-key'
{stackGroups, groupOrder, sectionOffsets} = require '../summary-sections/display-parameters'
{query} = require '../../db'
{NavLink} = require '../../nav'


require '../main.styl'
require '../summary-sections/main.styl'


SectionOptionsContext = createContext {
  pixelsPerMeter: 2
  showTriangleBars: true
}

class SectionColumn extends Component
  render: ->
    h 'div.section-column', {style: {position: 'relative', width: 240}}, @props.children

class LocationGroup extends Component
  @defaultProps: {
    offsetTop: 0
  }
  render: ->
    {width, name, children, offsetTop, rest...} = @props
    width ?= null

    h 'div.location-group', {id: name, style: {width}, rest...}, [
      h 'h1', {}, name
      h 'div.location-group-body', {}, children
    ]

class GeneralizedSections extends SummarySections
  @defaultProps: {
    scrollable: true
  }
  constructor: (props)->
    super props
    @state =
      surfaces: []
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
        showFacies: true?
        showFloodingSurfaces: false
        showTriangleBars: true
        showLithostratigraphy: true
        showSequenceStratigraphy: true
        # Allows us to test the serialized query mode
        # we are developing for the web
        serializedQueries: global.SERIALIZED_QUERIES
        condensedDisplay: true
        update: @updateOptions
        sectionIDs: []
        sectionData: null
        showCarbonIsotopes: true

    query 'generalized-section', null, {baseDir: join(__dirname,'..')}
      .then (data)=>
        groupedSections = d3.nest()
          .key (d)->d.section
          .entries data

        vals = groupedSections.map ({key, values})->
          start = 0
          end = d3.max values, (d)->d.top
          {
            section: key
            divisions: values
            start
            end
            clip_end: end
            height: end-start
            id: key
            location: key
            offset: 0
            range: [start, end]
          }

        @mutateState {sectionData: {$set: vals}}

    @optionsStorage = new LocalStorage 'summary-sections'
    v = @optionsStorage.get()
    return unless v?
    @state = update @state, {options: {$merge: v}}

  renderSections: ->
    {scrollable} = @props
    {dimensions, options, sectionPositions, surfaces, sectionData} = @state
    {dragdealer, dragPosition, rest...} = options
    {showFacies, showLithostratigraphy, activeMode} = options

    skeletal = activeMode == 'skeleton'

    # Group sections by data instead of pre-created elements
    return null unless sectionData?
    __sections =  sectionData.map (row)=>
      {offset, range, height, start, end, divisions, rest...} = row

      # Clip off the top of some columns...
      end = row.clip_end

      height = end-start
      range = [start, end]
      offset = 670-height

      sec = h GeneralizedSVGSection, {
        skeletal
        zoom: 0.1,
        key: row.id,
        divisions
        showFacies
        offset
        onResize: @onSectionResize(row.id)
        range
        height
        start
        end
        rest...
      }

      key = row.id
      h LocationGroup, {key, name: key}, [
        h SectionColumn, [sec]
      ]

    paddingLeft = 30
    marginTop = 50
    overflow = "scroll"
    {canvas} = @state.dimensions
    minHeight = 1500

    h 'div#section-pane', {style: {overflow}}, [
      h SectionLinkOverlay, {
        skeletal,
        paddingLeft,
        canvas...,
        marginTop,
        sectionPositions,
        showLithostratigraphy: false
        showSequenceStratigraphy: true
        showCarbonIsotopes: false
        surfaces: []
      }
      @__buildCanvas(__sections)
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

    h 'div.page.section-page#generalized-sections', [
      h 'div.panel-container', [
        navigationController
        @renderSections()
      ]
      h SummarySectionsSettings, options
    ]

  onSectionResize: (key)=>(contentRect)=>
    console.log "Section #{key} was resized", contentRect

    @mutateState {sectionPositions: {"#{key}": {$set: contentRect}}}

  componentDidUpdate: (prevProps, prevState)->
    if prevState.dimensions != @state.dimensions
      console.log "Dimensions changed!"

      obj = {}
      window.resizers.map (section)->
        {measureRef,props} = section
        if measureRef.measure?
          contentRect = measureRef.measure()
          obj["#{props.id}"] = {$set: contentRect}
      @mutateState {sectionPositions: obj}

  onCanvasResize: ({bounds})=>
    {width, height} = bounds
    height = 1720 #! HACK!
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

window.resizeEverything = ->
  window.resizers.map ({measure,onResize})->
      if measure.measure?
        measure.measure()

module.exports = {GeneralizedSections}


