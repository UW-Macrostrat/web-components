import {findDOMNode} from "react-dom"
import * as d3 from "d3"
import "d3-selection-multi"
import {Component, createElement, createRef} from "react"
import h from "react-hyperscript"
import Measure from 'react-measure'
import {SectionAxis} from "./axis"
import {PlatformConsumer} from "../../platform"
import {SymbolColumn} from "./symbol-column"
import {FloodingSurface, TriangleBars} from "./flooding-surface"
import {IntervalEditor} from "./modal-editor"
import {LithologyColumn, GeneralizedSectionColumn} from "./lithology"
import {Popover, Position} from "@blueprintjs/core"
import {withRouter} from "react-router-dom"
import {Notification} from "../../notify"
import {FaciesContext} from "../facies"
import {SVGNamespaces, KnownSizeComponent, ColumnDivisionsProvider} from "../util"
import {SequenceStratConsumer} from "../sequence-strat-context"
import {db, storedProcedure, query} from "../db"
import {ColumnProvider} from './context'
import {SimplifiedLithologyColumn, CoveredOverlay, FaciesColumnInner,
        DivisionEditOverlay, LithologyColumnInner} from './lithology'

fmt = d3.format('.1f')

IntervalNotification = (props)->
  {id, height, bottom, top, surface} = props
  h 'div', [
    h 'h4', "Section #{id} @ #{fmt(height)} m"
    h 'p', [
      'Interval ID: '
      h('code', id)
    ]
    h 'p', "#{bottom} - #{top} m"
    if surface then h('p', ["Surface: ", h('code',surface)]) else null
  ]

class BaseSVGSectionComponent extends KnownSizeComponent
  @defaultProps: {
    zoom: 1
    pixelsPerMeter: 20
    skeletal: false
    offset: 0
    offsetTop: null
    useRelativePositioning: true
    showTriangleBars: false
    trackVisibility: false
    innerWidth: 100
    height: 100 # Section height in meters
    lithologyWidth: 40
    showWhiteUnderlay: true
    showFacies: true
    triangleBarsOffset: 0
    triangleBarRightSide: false
    onResize: ->
    marginLeft: -10
    padding: {
      left: 30
      top: 10
      right: 20
      bottom: 10
    }
  }
  constructor: (props)->
    super props
    @measureRef = createRef()

    @state = {
      @state...
      hoveredInterval: null
      popoverIsOpen: false
      visible: not @props.trackVisibility
      scale: d3.scaleLinear().domain(@props.range)
    }
    @state.scale.clamp()

  renderWhiteUnderlay: ->
    {showWhiteUnderlay, skeletal} = @props
    return null if not showWhiteUnderlay
    return null if skeletal
    {innerWidth, padding, marginLeft, position: pos} = @props
    innerHeight = pos.heightScale.pixelHeight()
    {left, right} = padding
    outerWidth = innerWidth+(left+right)

    {triangleBarsOffset: tbo, triangleBarRightSide: onRight} = @props
    left += tbo
    marginLeft -= tbo
    marginRight = 0
    outerWidth += tbo

    x = -left
    if @props.showTriangleBars and not onRight
      x += 55
    if @props.showTriangleBars and onRight
      outerWidth += 75


    return h 'rect.underlay', {
      width: outerWidth-50
      height: innerHeight+10
      x
      y: -5
      fill: 'white'
    }

  createEditOverlay: (p={})=>
    {triangleBarsRightSide: onRight} = @props
    {hoveredInterval} = @state
    return null unless hoveredInterval
    return null unless @props.inEditMode
    pos = @props.position
    scale = pos.heightScale.local
    top = scale(hoveredInterval.top)
    bottom = scale(hoveredInterval.bottom)
    height = bottom-top
    width = pos.width-@props.padding.left-@props.padding.right-50

    _ = Position.LEFT
    if onRight
      _ = Position.RIGHT
    popoverProps = {position: _,}# isOpen: @state.popoverIsOpen}

    position = 'absolute'
    outerStyle = {left: p.left, top: p.top, position, width}
    style = {top, height, width, position}
    h 'div.edit-overlay', {style: outerStyle}, [
      h 'div.cursor-container', {style}, [
        h Popover, popoverProps, [
          h 'div.cursor', {style: {width, height}}
          h IntervalEditor, {
            interval: hoveredInterval
            height: hoveredInterval.height
            section: @props.id
            onUpdate: @onIntervalUpdated
            #onPrev: @hoverAdjacent(-1)
            #onNext: @hoverAdjacent(1)
            #onClose: => @setState {popoverIsOpen: false}
          }
        ]
      ]
    ]

  hoverAdjacent: (offset=1) => =>
    {divisions} = @props
    {hoveredInterval} = @state
    return if not hoveredInterval?
    ix = divisions.findIndex (d)->d.id = hoveredInterval.id
    return unless ix?
    newDiv = divisions[ix+offset]
    return unless newDiv?
    @setState {hoveredInterval: newDiv}

  onIntervalUpdated: =>
    console.log "Updating intervals"
    {id: section} = @props
    {hoveredInterval} = @state
    # Could potentially make this fetch less
    query 'lithology', [section]
      .then (divisions)=>
        cset = {divisions}
        if hoveredInterval?
          newHovered = divisions.find (d)-> d.id == hoveredInterval.id
          cset.hoveredInterval = newHovered
        @setState cset

  render: ->
    {id, zoom, padding, lithologyWidth,
     innerWidth, onResize, marginLeft,
     showFacies, height, clip_end,
     showTriangleBars,
     showFloodingSurfaces,
     showWhiteUnderlay,
     position,
     range,
     pixelsPerMeter
     } = @props

    {heightScale} = position
    innerHeight = heightScale.pixelHeight()
    marginTop = heightScale.pixelOffset()
    scale = heightScale.local

    {left, top, right, bottom} = padding

    outerHeight = innerHeight+(top+bottom)
    outerWidth = innerWidth+(left+right)

    {divisions} = @props
    {visible} = @state
    divisions = divisions.filter (d)->not d.schematic

    {skeletal} = @props

    # Set up number of ticks
    nticks = (height*@props.zoom)/10

    fs = null
    if showFloodingSurfaces
      fs = h FloodingSurface, {
        scale
        zoom
        id
        offsetLeft: -40
        lineWidth: 30
        divisions
      }

    overhangLeft = 0
    overhangRight = 0

    {triangleBarsOffset: tbo, triangleBarRightSide: onRight} = @props
    marginLeft -= tbo
    marginRight = 0
    outerWidth += tbo
    triangleBars = null
    if showTriangleBars
      offsetLeft = -tbo+35
      if onRight
        overhangRight = 45
        offsetLeft *= -1
        offsetLeft += tbo+20
        marginRight -= tbo
        marginLeft += tbo
      else
        overhangLeft = 25
        left = tbo

      triangleBars = h TriangleBars, {
        scale
        zoom
        id
        offsetLeft
        lineWidth: 20
        divisions
        orders: [@props.sequenceStratOrder, @props.sequenceStratOrder-1]
      }

    # Expand SVG past bounds of section
    style = {
      width: outerWidth
      height: outerHeight
    }

    transform = "translate(#{left} #{@props.padding.top})"

    onHoverInterval = null
    if @props.inEditMode
      onHoverInterval = (d, opts)=>
        @setState {hoveredInterval: d}

    onEditInterval = (d, opts)=>
      {history} = @props
      {height, event} = opts
      if not event.shiftKey
        history.push("/sections/#{id}/height/#{height}")
        return
      Notification.show {
        message: h IntervalNotification, {d..., height}
        timeout: 2000
      }

    minWidth = outerWidth
    position = 'absolute'
    top = marginTop
    h "div.section-container", {
      className: if @props.skeletal then "skeleton" else null
      style: {
        minWidth, top, position,
        marginLeft: -overhangLeft
        marginRight: -overhangRight
      }
    }, [
      h 'div.section-header', [
        h("h2", {style: {zIndex: 20}}, id)]
      h 'div.section-outer', [
        @createEditOverlay({left, top: @props.padding.top})
        h ColumnProvider, {
          height: @props.height
          range
          zoom
          pixelsPerMeter
          divisions
        }, [
          h "svg.section", {
            SVGNamespaces...
            style
          }, [
            h 'g.backdrop', {transform}, [
              @renderWhiteUnderlay()
              h GeneralizedSectionColumn, {
                width: innerWidth
                height: innerHeight
                divisions
                scale
                id
                grainsizeScaleStart: 40
              }, [
                if showFacies then h(FaciesColumnInner, {width: innerWidth}) else null
                h CoveredOverlay, {width: innerWidth}
                h SimplifiedLithologyColumn, {width: innerWidth}
              ]
              h DivisionEditOverlay, {
                onEditInterval
                onHoverInterval
              }
              h SymbolColumn, {
                scale
                height: innerHeight
                left: 90
                id
                zoom
              }
              fs
              triangleBars
              h SectionAxis, {scale, ticks: nticks}
            ]
          ]
        ]
      ]
    ]

SVGSectionComponent = (props)->
  {id, divisions} = props
  h PlatformConsumer, null, ({inEditMode})->
    h SequenceStratConsumer, null, (value)->
      {showTriangleBars, showFloodingSurfaces, sequenceStratOrder} = value
      h ColumnDivisionsProvider, {id, divisions}, (rest)->
        h withRouter(BaseSVGSectionComponent), {
          showTriangleBars, showFloodingSurfaces,
          sequenceStratOrder, inEditMode, props...,
          rest...
        }

export {BaseSVGSectionComponent, SVGSectionComponent}
