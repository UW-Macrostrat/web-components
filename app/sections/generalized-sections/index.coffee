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

{SummarySectionsBase} = require '../summary-sections'
{GeneralizedSectionsSettings} = require '../summary-sections/settings'
LocalStorage = require '../storage'
{getSectionData} = require '../section-data'
{IsotopesComponent} = require '../summary-sections/carbon-isotopes'
{GeneralizedSVGSection} = require './column'
{SectionNavigationControl} = require '../util'
{LinkOverlayBase} = require '../summary-sections/link-overlay'
{LithostratKey} = require '../summary-sections/lithostrat-key'
{FaciesDescriptionSmall} = require '../facies-descriptions'
{Legend} = require '../summary-sections/legend'
{SectionOptionsContext, defaultSectionOptions} = require '../summary-sections/options'
require '../summary-sections/main.styl'
{stackGroups, groupOrder, sectionOffsets} = require '../summary-sections/display-parameters'
{NavLink} = require '../../nav'
{SequenceStratConsumer} = require '../sequence-strat-context'
{GeneralizedSectionPositioner} = require './positioner'
{query} = require '../../db'
require '../main.styl'

GeneralizedSectionPositions = {
  Onis: {x: 0, y: 0}
  Tsams: {x: 15, y: 220}
  Ubisis: {x: 5, y: 290}
}

class LinkOverlay extends LinkOverlayBase
  render: ->
    {width, height} = @props
    h 'g#section-link-overlay', [
      h 'g.section-links', @prepareData().map @buildLink
    ]

class GeneralizedSectionsBase extends SummarySectionsBase
  @defaultProps: {
    scrollable: true
  }
  SettingsPanel: GeneralizedSectionsSettings
  pageID: 'generalized-sections'
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
        showFacies: true
        showFaciesTracts: false
        showSimplifiedLithology: true
        showSequenceStratigraphy: true
        # Allows us to test the serialized query mode
        # we are developing for the web
        update: @updateOptions
        exportSVG: @exportSVG

    query 'generalized-section', null, {baseDir: join(__dirname,'..')}
      .then (data)=>
        groupedSections = d3.nest()
          .key (d)->d.section
          .entries data

        vals = groupedSections.map ({key: section, values: divisions})->
          start = 0
          # Bottom is the first division with an assigned facies
          for d in divisions
            if d.facies != 'none'
              start = d.bottom
              break
          # Top of the last section is taken as the height
          # at which to clip off errant facies
          end = divisions[divisions.length-1].section_end

          return {
            section
            divisions
            start
            end
            clip_end: end
            height: end-start
            id: section
            location: section
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
    {showFacies, showLithology} = options
    return null unless sectionData?

    positioner = new GeneralizedSectionPositioner {
      pixelsPerMeter: 1.5
      columnWidth: 50
      positions: GeneralizedSectionPositions
      scaleMultipliers: {x: 70}
      margin: 40
      marginHorizontal: 80
    }
    groupedSections = positioner.update(sectionData)

    getGeneralizedHeight = (surface)->
      # Gets heights of surfaces in stacked sections
      {section, height, inferred} = surface
      for newSection in sectionData
        for s in newSection.divisions
          continue unless s.original_section.trim() == section.trim()
          continue unless s.original_bottom == height
          return {section: s.section, height: s.bottom, inferred}
      return null

    surfaces = surfaces.map ({section_height, rest...})->
      # Update section heights to use generalized section heights
      section_height = section_height.map(getGeneralizedHeight).filter (d)->d?
      {section_height, rest...}

    size = do -> {width, height} = groupedSections.position

    links = null
    links = h LinkOverlay, {
      size...,
      surfaces, groupedSections
      showLithostratigraphy: false
      showSequenceStratigraphy: true
    }
    h 'svg#section-pane', {size..., style: size}, [
      links
      h 'g.section-pane-inner', {}, groupedSections.map (row, i)=>
        {columns: [[section]]} = row
        vals = do -> {id, divisions, position} = section
        h GeneralizedSVGSection, {vals..., showFacies, showLithology}
    ]

  exportSVG: =>
    el = findDOMNode(@).querySelector("svg#section-pane")
    serializer = new XMLSerializer()
    return unless el?
    svgString = serializer.serializeToString(el)
    fs = require('fs')
    fs.writeFileSync(
      '/Users/Daven/Desktop/exported-generalized-sections.svg',
      svgString, 'utf-8'
    )

GeneralizedSections = (props)->
  h SequenceStratConsumer, null, ({actions, rest...})->
    h GeneralizedSectionsBase, {props..., rest...}


module.exports = {GeneralizedSections}


