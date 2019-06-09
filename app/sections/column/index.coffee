import {findDOMNode} from "react-dom"
import * as d3 from "d3"
import "d3-selection-multi"
import {Component, createElement, createContext} from "react"
import h from "react-hyperscript"
import VisibilitySensor from "react-visibility-sensor"
import {SectionAxis} from "./axis"
import SectionImages from "./images"
import NotesColumn from "./notes"
import {BaseSectionComponent} from "./base"
import "./main.styl"
import {Intent} from "@blueprintjs/core"
import {Notification} from "../../notify"
import {GrainsizeScale} from "./grainsize"
import {SymbolColumn} from "./symbol-column"
import {ModalEditor} from "./modal-editor"
import {SVGNamespaces} from "../util"
import Samples from "./samples"
import {FloodingSurface, TriangleBars} from "./flooding-surface"
import {
 LithologyColumn, GeneralizedSectionColumn,
 FaciesColumn, CoveredColumn
} from "./lithology"
import {SequenceStratConsumer} from "../sequence-strat-context"
import {db, storedProcedure, query} from "../db"
import {dirname} from "path"
import update from "immutability-helper"

fmt = d3.format(".1f")
baseDir = dirname require.resolve '..'
sql = (id)-> storedProcedure(id, {baseDir})

class SectionOverlay extends Component
  @defaultProps:
    padding: 30
    isEditable: false
  constructor: (props)->
    super props
    @state = lithologyData: null

class SectionComponent extends BaseSectionComponent
  @defaultProps: {
    BaseSectionComponent.defaultProps...
    visible: false
    trackVisibility: true
    innerWidth: 250
    offsetTop: null
    scrollToHeight: null
    height: 100 # Section height in meters
    lithologyWidth: 40
    logWidth: 450
    containerWidth: 1000
    showSymbols: true
    showNotes: true
    showFacies: false
    isEditable: false
    editingInterval: {id: null}
    useRelativePositioning: true
    padding:
      left: 150
      top: 30
      right: 0
      bottom: 30
  }
  constructor: (props)->
    super props
    @state = {
      @state...
      loaded: false
      editingInterval: {id: null}
      visible: not @props.trackVisibility
      scale: d3.scaleLinear().domain(@props.range)
      naturalHeight: d3.sum(@props.imageFiles, (d)->d.height)
    }

  getGeometry: =>
    innerHeight = @props.height*@props.pixelsPerMeter*@props.zoom
    padding = {}
    for k,v of @props.padding
      if k == 'left' or k == 'bottom'
        padding[k] = @props.padding[k]
      else
        padding[k] = @props.padding[k]*@props.zoom
    {left, top, right, bottom} = padding

    outerHeight = innerHeight+(top+bottom)
    innerWidth = @props.innerWidth*@props.zoom
    if innerWidth < @props.lithologyWidth
      innerWidth = @props.lithologyWidth
    outerWidth = innerWidth+(left+right)
    {padding, innerHeight, outerHeight, innerWidth, outerWidth}

  renderMain: ->
    {id, zoom, scrollToHeight} = @props

    if scrollToHeight?
      scrollTop = @state.scale.invert(scrollToHeight)

    scaleFactor = @props.scaleFactor/@props.pixelsPerMeter
    extraSpace = if zoom > 0.5 then 2.5*zoom else 0#@state.naturalHeight/innerHeight

    {innerHeight, padding, outerWidth, innerWidth, outerHeight} = @getGeometry()
    @state.scale.range [innerHeight, 0]


    {heightOfTop, showFacies} = @props
    marginTop = heightOfTop*@props.pixelsPerMeter*@props.zoom

    [bottom,top] = @props.range

    @log "Section #{id}"
    @log "Images are #{@state.naturalHeight} pixels high"
    @log "Height of section: #{top-bottom} m, #{innerHeight} px"
    @log "Natural scale of section images: #{@state.naturalHeight/(top-bottom)} px/m"
    @log "Scale height: #{@state.scale(1)-@state.scale(0)} px/m"
    @log "Forced scale factor: #{scaleFactor*@props.pixelsPerMeter}"
    fn = (v, d)-> v+" #{d.width} px,"
    @log @props.imageFiles.reduce(fn, "Width of images: ")

    # Set text of header for appropriate zoom level
    txt = if @props.zoom > 0.5 then "Section " else ""
    txt += id

    {scale,visible, editingInterval, divisions} = @state
    zoom = @props.zoom

    {skeletal} = @props

    innerElements = [
      h ModalEditor, {
        isOpen: editingInterval.id?
        interval: divisions.find (d)-> d.id == editingInterval.id
        height: editingInterval.height
        section: id
        onSelectFacies: @setFaciesForInterval
        onSelectGrainSize: @setGrainSizeForInterval
        onSelectFloodingSurfaceOrder: @setFloodingSurfaceOrderForInterval
        closeDialog: =>
          @setState {editingInterval: {id:null}}
        addInterval: @addInterval
        removeInterval: @removeInterval
        onUpdate: @onIntervalUpdated
      }
    ]

    onEditInterval = null
    if isEditable and showFacies
      onEditInterval = @onEditInterval

    if @state.visible
      {showSymbols, isEditable} = @props
      innerElements.push @renderOverlaySVG()

    if @props.zoom > 0.25 and @state.visible
      img = h SectionImages, {
        padding
        lithologyWidth: @props.lithologyWidth
        imageFiles: @props.imageFiles
        scaleFactor
        extraSpace
        skeletal: skeletal or @props.activeDisplayMode != 'image'
        zoom
      }
      innerElements.push img

    style = {
      width: outerWidth
      height: outerHeight
    }

    notesEl = null
    if @props.showNotes and @props.zoom > 0.50
      # Notes column manages zoom on its own
      notesEl = h NotesColumn, {
        id
        visible
        sectionLimits: @props.range
        height: innerHeight*zoom
        width: @props.logWidth*zoom
        zoom,
        marginTop: @props.padding.top
      }

    width = outerWidth
    style = {top: marginTop}

    h "div.section-container", {
        className: if @props.skeletal then "skeleton" else null
      }, [
      h 'div.section-header', [h "h2", txt]
      h 'div.section-outer', [
          h 'div.section', {style}, innerElements
          notesEl
      ]
    ]

  render: ->
    h 'div#section-pane', [
      @renderMain()
    ]

  componentDidUpdate: ->
    node = findDOMNode(this)
    {scrollToHeight, id} = @props
    {scale, loaded} = @state
    return unless scrollToHeight?
    return if loaded
    scrollTop = scale(scrollToHeight)-window.innerHeight/2
    node.scrollTop = scrollTop

    Notification.show {
      message: "Section #{id} @ #{fmt(scrollToHeight)} m"
      intent: Intent.PRIMARY
    }
    @setState {loaded: true}


  log: ->

  onEditInterval: (interval, opts={})=>
    return unless @props.isEditable
    {id} = interval
    {height} = opts
    @setState {editingInterval: {id, height}}

  renderOverlaySVG: =>
    {innerHeight, outerHeight, innerWidth, outerWidth, padding} = @getGeometry()
    #@yAxis.scale(@props.scale)
    {showSymbols, isEditable, showFacies} = @props
    left = @props.padding.left
    transform = "translate(#{left} #{@props.padding.top})"

    showGeneralizedSections =  @props.activeDisplayMode == 'generalized'

    {lithologyWidth, zoom, id, isEditable, showFacies, lithologyWidth} = @props
    {scale, divisions} = @state

    ticks = (@props.height*@props.zoom)/10

    range = [128,208].map (d)->d-40
      .map (d)->d*zoom
      .map (d)->d+lithologyWidth

    gs = null
    samples = null

    height = innerHeight
    __ = [
        h SectionAxis, {scale, ticks}
        h LithologyColumn, {
          divisions
          width: lithologyWidth
          onEditInterval: @onEditInterval
          showCoveredOverlay: true
          height, showFacies, scale, id
        }
    ]

    if zoom > 0.4
      __.push h GrainsizeScale, {
        height
        range
      }

      if showGeneralizedSections
        __.push h GeneralizedSectionColumn, {
          scale, id,
          divisions
          grainsizeScaleStart: range[0]-lithologyWidth
          width: range[1]-lithologyWidth
          left: lithologyWidth
          height: innerHeight
        }

      if @props.showCarbonIsotopes
        __.push h Samples, {scale, zoom, id}

      if @props.showFloodingSurfaces
        __.push h FloodingSurface, {divisions, scale, zoom, id}

      if @props.showTriangleBars
        order = @props.sequenceStratOrder
        __.push h TriangleBars, {
          divisions, scale, zoom, id,
          offsetLeft: -85, lineWidth: 25, orders: [order, order-1]}

      if @props.showSymbols
        __.push h SymbolColumn, {scale, id, left: 215}

    height = outerHeight
    h "svg.overlay", {
      SVGNamespaces...
      width: outerWidth
      height
    }, [
      h 'g.backdrop', {transform}, __
    ]

  createAxisLines: =>
    g = @backdrop.append 'g'
      .attrs class: 'y graticule'

    r = @props.range
    g.selectAll 'line'
      .data [r[0]..r[1]]
      .enter()
        .append('line')
        .attrs (d)=>
          y = @props.scale(d)
          {x1: 0, x2: @props.innerWidth, y1: y, y2: y}

  onIntervalUpdated: =>
    console.log "Updating intervals"
    {id: section} = @props
    # Could potentially make this fetch less
    divisions = await query 'lithology', [section]
    @setState {divisions}

  addInterval: (height)=>
    {id: section, editingInterval} = @props
    {id} = await db.one sql('add-interval'), {section,height}
    divisions = await query 'lithology', [section]
    {id: oldID, height} = editingInterval
    if oldID?
      editingInterval = {id, height}
    @setState {divisions, editingInterval}


  removeInterval: (id)=>
    {id: section} = @props

    await db.none sql('remove-interval'), {section, id}

    divisions = await query 'lithology', [section]
    @setState {divisions, editingInterval: {id:null}}


SectionComponentHOC = (props)->
  h SequenceStratConsumer, null, (value)->
    {showTriangleBars, showFloodingSurfaces, sequenceStratOrder} = value
    h SectionComponent, {showTriangleBars, showFloodingSurfaces, sequenceStratOrder, props...}

export {SectionComponentHOC as SectionComponent}
