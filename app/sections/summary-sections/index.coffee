{findDOMNode} = require 'react-dom'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
{Component, createContext, createRef} = require 'react'
{HotkeysTarget, Hotkeys, Hotkey} = require '@blueprintjs/core'
{Icon} = require 'react-fa'
update = require 'immutability-helper'
PropTypes = require 'prop-types'
{debounce} = require 'underscore'
Measure = require('react-measure').default

{SummarySectionsSettings} = require './settings'
LocalStorage = require '../storage'
{getSectionData} = require '../section-data'
{IsotopesComponent} = require './carbon-isotopes'
{SVGSectionComponent} = require './column'
{SectionNavigationControl} = require '../util'
{SectionLinkOverlay} = require './link-overlay'
{stackGroups, groupOrder, sectionOffsets} = require './display-parameters'
{SectionOptionsContext, defaultSectionOptions} = require './options'
{FaciesDescriptionSmall} = require '../facies-descriptions'
{LithostratKey} = require './lithostrat-key'
{NavLink} = require '../../nav'
{Legend} = require './legend'
{query} = require '../../db'
{SectionPositioner} = require './positioner'

d3 = require 'd3'

require '../main.styl'

class Box
  constructor: (opts)->
    @x ?= opts.x
    @y ?= opts.y
    @width ?= opts.width
    @height ?= opts.height

class SectionColumn extends Component
  render: ->
    {style} = @props
    style.position = 'relative'
    style.width ?= 240
    h 'div.section-column', {style}, @props.children

class LocationGroup extends Component
  @defaultProps: {
    offsetTop: 0
  }
  render: ->
    {id, name, location, width, children, style} = @props
    name ?= location
    id ?= location
    style ?= {}
    style.width ?= width
    h 'div.location-group', {id, style}, [
      h 'h1', {}, name
      h 'div.location-group-body', {}, children
    ]

groupSectionData = (sections)->
  stackGroup = (d)=>
    for g in stackGroups
      if g.indexOf(d.id) != -1
        return g
    return d.id

  indexOf = (arr)->(d)->
    arr.indexOf(d)

  __ix = indexOf(stackGroups)

  sectionGroups = d3.nest()
    .key (d)->d.location
    .key stackGroup
    .sortKeys (a,b)->__ix(a)-__ix(b)
    .entries sections

  # Change key names to be more semantic
  for g in sectionGroups
    g.columns = g.values.map (col)->
      return col.values
    delete g.values
    g.location = g.key
    delete g.key

  __ix = indexOf(groupOrder)
  sectionGroups.sort (a,b)->__ix(a.location)-__ix(b.location)
  return sectionGroups

class WrappedSectionComponent extends Component
  render: ->
    h SectionOptionsContext.Consumer, null, (opts)=>
      h SVGSectionComponent, {opts..., @props...}

class SummarySections extends Component
  @defaultProps: {
    scrollable: true
    groupMargin: 400
    columnMargin: 100
    columnWidth: 150
  }
  pageID: 'summary-sections'
  constructor: (props)->
    super props
    @state = {
      sections: []
      surfaces: []
      dimensions: {
        canvas: {width: 100, height: 100}
      }
      sectionPositions: {}
      options: {
        settingsPanelIsActive: false
        modes: [
          {value: 'normal', label: 'Normal'}
          {value: 'skeleton', label: 'Skeleton'}
        ]
        showNavigationController: true
        activeMode: 'normal'
        defaultSectionOptions...
        showLegend: true
        # Allows us to test the serialized query mode
        # we are developing for the web
        serializedQueries: global.SERIALIZED_QUERIES
        condensedDisplay: true
        update: @updateOptions
        sectionIDs: []
        showLithostratigraphy: true
        showSequenceStratigraphy: true
        showCarbonIsotopes: true
      }
    }

    @optionsStorage = new LocalStorage 'summary-sections'
    v = @optionsStorage.get()
    return unless v?
    @state = update @state, options: {$merge: v}

    query 'lithostratigraphy-surface', null, {baseDir: __dirname}
      .then (surfaces)=>
        surfaces.reverse()
        @setState {surfaces}

  renderChemostratigraphy: ->
    {sections, scrollable} = @props
    {dimensions, options, sectionPositions, surfaces} = @state
    {dragdealer, dragPosition, rest...} = options
    {showFloodingSurfaces,
     showSequenceStratigraphy,
     showTriangleBars,
     showCarbonIsotopes,
     showOxygenIsotopes,
     showFacies} = options

    return null unless showCarbonIsotopes or showOxygenIsotopes

    row = sections.find (d)->d.id == 'J'
    {offset, location, rest...} = row
    location = null

    __ = []
    if showCarbonIsotopes
      __.push h IsotopesComponent, {
        zoom: 0.1,
        key: 'carbon-isotopes',
        showFacies
        offset
        location: ""
        surfaces
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
        offset
        location: ""
        surfaces
        rest...
      }

    h LocationGroup, {
      name: null
      className: 'chemostratigraphy'
    }, __

  renderSections: ->
    {sections, scrollable} = @props
    {dimensions, options, sectionPositions, surfaces} = @state
    {dragdealer, dragPosition, rest...} = options
    {showFloodingSurfaces,
     showSequenceStratigraphy,
     showTriangleBars,
     showCarbonIsotopes,
     showOxygenIsotopes,
     showFacies,
     showLegend,
     showLithostratigraphy,
     activeMode} = options

    return null unless sections.length > 0

    skeletal = activeMode == 'skeleton'

    mapRowToSection = (row)=>
      {offset, range, height, start, end, rest...} = row
      offset = sectionOffsets[row.id] or offset

      # Clip off the top of some columns...
      end = row.clip_end

      height = end-start
      range = [start, end]

      h WrappedSectionComponent, {
        zoom: 0.1,
        key: row.id,
        skeletal,
        triangleBarRightSide: row.id == 'J'
        showCarbonIsotopes,
        trackVisibility: false
        offset
        range
        height
        start
        end
        rest...
      }

    row = sections.find (d)->d.id == 'J'
    {offset, location, rest...} = row
    location = null

    lithostratKey = h LithostratKey, {
        zoom: 0.1, key: "key",
        surfaces,
        skeletal,
        offset
        rest...
      }

    groupedSections = groupSectionData(sections)

    height = 1800
    # Pre-compute section positions
    {groupMargin, columnMargin, columnWidth} = @props
    if showTriangleBars
      columnWidth += 25

    ## Create a section positioner
    positioner = new SectionPositioner({
      groupMargin,
      columnMargin,
      columnWidth,
      sectionOffsets
    })

    groupedSections = positioner.update(groupedSections)

    sectionGroups = groupedSections.map ({location, columns}, i)->
      marginRight = groupMargin
      if i == groupedSections.length-1
        marginRight = 0
      style = {marginRight, height}
      h LocationGroup, {key: location, location, style}, columns.map (col, i)->
        marginRight = columnMargin
        if i == columns.length-1
          marginRight = 0
        style = {marginRight, height, width: columnWidth}
        h SectionColumn, {key: i, style}, col.map mapRowToSection

    maxOffset = d3.max sections.map (d)->parseFloat(d.height)-parseFloat(d.offset)+669

    paddingLeft = if showTriangleBars then 90 else 30
    marginTop = 52 # This is a weird hack
    overflow = if scrollable then "scroll" else 'inherit'
    {canvas} = @state.dimensions

    minHeight = 1500

    h 'div#section-pane', {style: {overflow}}, [
      h "div#section-page-inner", {
        style: {zoom: 1, minHeight}
      }, [
        lithostratKey,
        @renderChemostratigraphy(),
        h "div#section-container", [
          h(Legend) if showLegend
          h SectionLinkOverlay, {
            paddingLeft,
            connectLines: true
            width: 2500,
            height,
            marginTop,
            groupedSections,
            showLithostratigraphy
            showSequenceStratigraphy
            showCarbonIsotopes
            surfaces
            skeletal
          }
          h 'div.grouped-sections', sectionGroups
        ]
      ]
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

    # Keep errors isolated within groups
    sections = null
    try
      sections = @renderSections()
    catch err
      console.error err

    h 'div.page.section-page', {id: @pageID}, [
      h 'div.panel-container', [
        h SectionOptionsContext.Provider, {value: @createSectionOptions()}, [
          navigationController
          sections
        ]
      ]
      h SummarySectionsSettings, {
        options...
      }
    ]

  createSectionOptions: =>
    value = {}
    for k,v of defaultSectionOptions
      value[k] = @state.options[k]
    triangleBarsOffset = 0
    if value.showTriangleBars
      triangleBarsOffset = 80
    return {
      triangleBarsOffset
      value...
    }

  mutateState: (spec)=>
    state = update(@state, spec)
    @setState state

  updateOptions: (opts)=>
    newOptions = update @state.options, opts
    @setState options: newOptions
    @optionsStorage.set newOptions

  toggleSettings: =>
    @updateOptions settingsPanelIsActive: {$apply: (d)->not d}

module.exports = {SummarySections, SectionOptionsContext}

