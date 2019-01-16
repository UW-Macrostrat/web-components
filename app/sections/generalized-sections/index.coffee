import {findDOMNode} from "react-dom"
import {Component, createContext} from "react"
import h from "react-hyperscript"
import {Icon} from "react-fa"
import {select} from "d3-selection"
import PropTypes from "prop-types"
import {join} from "path"
import d3 from "d3"
import update from "immutability-helper"
Measure = require('react-measure').default
import {debounce} from "underscore"

import {SummarySectionsBase} from "../summary-sections"
import {GeneralizedSectionsSettings} from "../summary-sections/settings"
import LocalStorage from "../storage"
import {getSectionData} from "../section-data"
import {IsotopesComponent} from "../summary-sections/carbon-isotopes"
import {GeneralizedSVGSection} from "./column"
import {SectionNavigationControl} from "../util"
import {LinkOverlayBase} from "../summary-sections/link-overlay"
import {LithostratKey} from "../summary-sections/lithostrat-key"
import {FaciesDescriptionSmall} from "../facies-descriptions"
import {Legend} from "../summary-sections/legend"
import {SectionOptionsContext, defaultSectionOptions} from "../summary-sections/options"
import "../summary-sections/main.styl"
import {stackGroups, groupOrder, sectionOffsets} from "../summary-sections/display-parameters"
import {NavLink} from "../../nav"
import {SequenceStratConsumer} from "../sequence-strat-context"
import {GeneralizedSectionPositioner} from "./positioner"
import {query} from "../../db"
import "../main.styl"

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
            if d.facies? and d.facies != 'none'
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


export {GeneralizedSections}


