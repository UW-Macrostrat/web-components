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
{LinkOverlayBase} = require '../summary-sections/link-overlay'
{LithostratKey} = require '../summary-sections/lithostrat-key'
{FaciesDescriptionSmall} = require '../facies-descriptions'
{Legend} = require '../summary-sections/legend'
require '../summary-sections/main.styl'
{stackGroups, groupOrder, sectionOffsets} = require '../summary-sections/display-parameters'
{NavLink} = require '../../nav'
{SectionPositioner} = '../summary-sections/positioner'
{GeneralizedSectionPositions} = require './positions.coffee'
{query} = require '../../db'
require '../main.styl'

class LinkOverlay extends LinkOverlayBase
  render: ->
    {width, height} = @props
    h 'g#section-link-overlay', [
      h 'g.section-links', @prepareData().map @buildLink
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
    {dimensions, options, surfaces, sectionData} = @state
    {dragdealer, dragPosition, rest...} = options
    {showFacies, showLithostratigraphy, activeMode} = options

    skeletal = activeMode == 'skeleton'

    sectionPositions = {}
    # Group sections by data instead of pre-created elements
    return null unless sectionData?
    __sections =  sectionData.map (row, i)=>
      {offset, range, height, start, end, divisions, rest...} = row

      # Clip off the top of some columns...
      end = row.clip_end

      # Bottom is the first division with an assigned facies
      for d in divisions
        if d.facies != 'none'
          start = d.bottom
          break

      {x,y} = GeneralizedSectionPositions[row.section]
      height = end-start
      range = [start, end]

      pixelsPerMeter = 1
      zoom = 1
      left = x*50
      offsetTop = -y

      pxHeight = height*pixelsPerMeter*zoom
      xv = [pxHeight,0].map (A)->A+offsetTop+50-2
      __ = {}
      __.bounds = {left, top: 0, width: 50, height: pxHeight}
      __.scale = d3.scaleLinear().domain(range).range(xv)
      __.key = row.id
      sectionPositions[row.section] = __

      h GeneralizedSVGSection, {
        skeletal
        pixelsPerMeter
        zoom
        key: row.id,
        left
        divisions
        showFacies
        offsetTop
        range
        height
        start
        end
        rest...
      }

    padding = 50
    marginTop = 50
    overflow = "scroll"
    {canvas} = @state.dimensions

    getGeneralizedHeight = (surface)->
      # Gets heights of surfaces in stacked sections
      {section, height, inferred} = surface
      for newSection in sectionData
        for s in newSection.divisions
          continue unless s.original_section.trim() == section.trim()
          continue unless s.original_bottom == height
          return {section: s.section, height: s.bottom, inferred}
      return null

    for surface in surfaces
      _ = surface.section_height.map(getGeneralizedHeight).filter (d)->d?
      surface.section_height = _

    height = 1000
    size = {width: 1200, height}

    links = h LinkOverlay, {size..., surfaces, sectionPositions}
    trans = {transform: "translate(#{padding},#{padding})"}
    h 'svg#section-pane', {style: size}, [
      links
      h 'g.section-pane-inner', trans, __sections
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

  updateOptions: (opts)=>
    newOptions = update @state.options, opts
    @setState options: newOptions
    @optionsStorage.set newOptions

  toggleSettings: =>
    @updateOptions settingsPanelIsActive: {$apply: (d)->not d}

module.exports = {GeneralizedSections}


