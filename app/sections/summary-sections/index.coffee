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

d3 = require 'd3'

require '../main.styl'

class SectionColumn extends Component
  render: ->
    h 'div.section-column', {style: {position: 'relative', width: 240}}, @props.children

class LocationGroup extends Component
  @defaultProps: {
    offsetTop: 0
  }
  render: ->
    {id, name, location, values, width, values, children, offsetTop, rest...} = @props
    name ?= location
    id ?= location
    h 'div.location-group', {id, style: {width}, rest...}, [
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
  }
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
    @measureRef = createRef()
    @optionsStorage = new LocalStorage 'summary-sections'
    v = @optionsStorage.get()
    return unless v?
    @state = update @state, options: {$merge: v}

    query 'lithostratigraphy-surface', null, {baseDir: __dirname}
      .then (surfaces)=>
        surfaces.reverse()
        @setState {surfaces}

  renderChemostratigraphy: ({offset, sectionResize})->
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
        onResize: sectionResize('carbon-isotopes')
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
        onResize: sectionResize('oxygen-isotopes')
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

    sectionResize = (key)=>(contentRect)=>
      cset = {}
      cset[key] = {$set: contentRect}
      @mutateState {sectionPositions: cset}

    mapRowToSection = (row)=>
      {offset, range, height, start, end, rest...} = row
      offset = sectionOffsets[row.id] or offset

      # Clip off the top of some columns...
      end = row.clip_end

      height = end-start
      range = [start, end]


      #h SectionOptionsContext.Consumer, null, (v)=>
      #  console.log opts
      h WrappedSectionComponent, {
        zoom: 0.1, key: row.id
        skeletal,
        triangleBarRightSide: row.id == 'J'
        showCarbonIsotopes,
        trackVisibility: false
        onResize: @onSectionResize(row.id)
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
        onResize: sectionResize("key")
        offset
        rest...
      }

    groupedSections = groupSectionData(sections)

    sectionGroups = groupedSections.map ({location, columns})->
      h LocationGroup, {key: location, location}, columns.map (col, i)->
        h SectionColumn, {key: i}, col.map mapRowToSection

    __sections = [
      lithostratKey,
      @renderChemostratigraphy({offset, sectionResize}),
      sectionGroups...
    ]

    maxOffset = d3.max sections.map (d)->parseFloat(d.height)-parseFloat(d.offset)+669

    if showLegend
      __sections.push h Legend

    paddingLeft = if showTriangleBars then 90 else 30
    marginTop = 50
    overflow = if scrollable then "scroll" else 'inherit'
    {canvas} = @state.dimensions

    h 'div#section-pane', {style: {overflow}}, [
      h SectionLinkOverlay, {
        skeletal, paddingLeft, canvas...,
        marginTop,
        sectionPositions,
        showLithostratigraphy
        showSequenceStratigraphy
        showCarbonIsotopes
        surfaces
      }
      @__buildCanvas(__sections)
    ]

  __buildCanvas: (sections)->
    minHeight = 1500
    h Measure, {
      bounds: true,
      innerRef: (ref)=>
        @measureRef = ref
      onResize: @onCanvasResize,
      scroll: true
    }, ({measureRef})=>
      h "div#section-page-inner", {
        ref: measureRef
        style: {zoom: 1, minHeight}
      }, sections

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
        h SectionOptionsContext.Provider, {value: @createSectionOptions()}, [
          navigationController
          @renderSections()
        ]
      ]
      h SummarySectionsSettings, {
        reloadCorrelations: @resizeAllSections
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

  onSectionResize: (key)=>(contentRect)=>
    {scrollTop, scrollLeft} =  @measureRef.offsetParent
    console.log "Section #{key} was resized", contentRect
    {bounds, __rest...} = contentRect
    {top, right, bottom, left, rest...} = bounds
    top += scrollTop
    bottom += scrollTop
    left += scrollLeft
    right += scrollLeft
    bounds = {top, right, bottom, left, rest...}
    sectionPositions = {}
    sectionPositions[key] = {$set: {bounds, __rest...}}
    @mutateState {sectionPositions}

  resizeAllSections: =>
    console.log "Resizing all sections"

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

  mutateState: (spec)=>
    state = update(@state, spec)
    @setState state

  onCanvasResize: ({bounds, scroll})=>
    {width, height} = scroll
    console.log scroll
    height = 1800 #! HACK!
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

module.exports = {SummarySections, SectionOptionsContext}

