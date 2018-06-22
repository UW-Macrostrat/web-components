{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement, createRef} = require 'react'
h = require 'react-hyperscript'
Measure = require('react-measure').default
{SectionAxis} = require '../column/axis'
{BaseSectionComponent} = require '../column/base'
{SymbolColumn} = require '../column/symbol-column'
{FloodingSurface, TriangleBars} = require '../column/flooding-surface'
{LithologyColumn, CoveredColumn, GeneralizedSectionColumn} = require '../column/lithology'
{withRouter} = require 'react-router-dom'
{Notification} = require '../../notify'
{FaciesContext} = require '../facies-descriptions'
{SVGNamespaces} = require '../util'

fmt = d3.format('.1f')

window.resizers = []

class BaseSVGSectionComponent extends BaseSectionComponent
  @defaultProps: {
    BaseSectionComponent.defaultProps...
    trackVisibility: false
    innerWidth: 100
    height: 100 # Section height in meters
    lithologyWidth: 40
    showFacies: true
    showFloodingSurfaces: true
    triangleBarsOffset: 0
    triangleBarRightSide: false
    onResize: ->
    marginLeft: -10
    padding:
      left: 30
      top: 10
      right: 20
      bottom: 10
  }
  constructor: (props)->
    super props
    @measureRef = createRef()

    @state = {
      @state...
      visible: not @props.trackVisibility
      scale: d3.scaleLinear().domain(@props.range)
    }
    @state.scale.clamp()

  onResize: ({bounds, offset, padding})=>
    {scale} = @state
    {
      id, padding, onResize, offsetTop
      offset: _offset, height
      triangleBarRightSide, triangleBarsOffset
    } = @props
    console.log "Resizing section #{id}"

    offsetTop ?= 670-height-_offset
    heightOfTop = offsetTop
    desiredPosition = heightOfTop*@props.pixelsPerMeter*@props.zoom

    return unless onResize?
    onResize {
      scale, bounds, offset
      triangleBarRightSide
      triangleBarsOffset
      padding
      pixelOffset: desiredPosition
    }

  render: ->
    {id, zoom, padding, lithologyWidth,
     innerWidth, onResize, marginLeft,
     showFacies, height, clip_end, offset, offsetTop
     showTriangleBars,
     showFloodingSurfaces
     } = @props

    innerHeight = height*@props.pixelsPerMeter*@props.zoom

    {left, top, right, bottom} = padding

    scaleFactor = @props.scaleFactor/@props.pixelsPerMeter

    @state.scale.range [innerHeight, 0]
    outerHeight = innerHeight+(top+bottom)
    outerWidth = innerWidth+(left+right)

    {heightOfTop} = @props
    marginTop = heightOfTop*@props.pixelsPerMeter*@props.zoom

    # Basic positioning
    # If we're not moving sections from the top, don't mess with positioning
    # at runtime
    offsetTop ?= 670-height-offset
    heightOfTop = offsetTop
    desiredPosition = heightOfTop*@props.pixelsPerMeter*@props.zoom

    [bottom,top] = @props.range

    txt = id

    {scale,visible, divisions} = @state
    divisions = divisions.filter (d)->not d.schematic

    {skeletal} = @props

    # Set up number of ticks
    nticks = (height*@props.zoom)/10

    fs = null
    if @props.showFloodingSurfaces
      fs = h FloodingSurface, {
        scale
        zoom
        id
        offsetLeft: -40
        lineWidth: 30
        divisions
      }

    {triangleBarsOffset: tbo, triangleBarRightSide: onRight} = @props
    left += tbo
    marginLeft -= tbo
    marginRight = 0
    outerWidth += tbo
    triangleBars = null
    if @props.showTriangleBars
      offsetLeft = -tbo+20
      if onRight
        offsetLeft *= -1
        offsetLeft += tbo
        marginRight -= tbo
        marginLeft += tbo
        left -= tbo

      triangleBars = h TriangleBars, {
        scale
        zoom
        id
        offsetLeft
        lineWidth: 20
        divisions
      }

    style = {
      width: outerWidth
      height: outerHeight
      marginLeft
      marginRight
    }

    transform = "translate(#{left} #{@props.padding.top})"

    minWidth = outerWidth
    position = 'absolute'
    h "div.section-container", {
      className: if @props.skeletal then "skeleton" else null
      style: {minWidth, position, top:desiredPosition}
    }, [
      h 'div.section-header', [
        h("h2", txt)]
      h 'div.section-outer', [
        h Measure, {
          ref: @measureRef
          bounds: true,
          client: true,
          offset: true,
          onResize: @onResize
        }, ({measureRef, measure})=>
          h "svg.section", {
            SVGNamespaces...
            style, ref: measureRef
          }, [
            h 'g.backdrop', {transform}, [
              h FaciesContext.Consumer, {}, ({facies})=>
                h GeneralizedSectionColumn, {
                  width: innerWidth
                  height: innerHeight
                  divisions
                  showFacies
                  showCoveredOverlay: true
                  facies: facies
                  scale
                  id
                  grainsizeScaleStart: 40
                  onEditInterval: (d, opts)=>
                    {history} = @props
                    {height, event} = opts
                    if not event.shiftKey
                      history.push("/sections/#{id}/height/#{height}")
                      return
                    Notification.show {
                      message: h 'div', [
                        h 'h4', "Section #{id} @ #{fmt(height)} m"
                        h 'p', [
                          'Interval ID: '
                          h('code', d.id)
                        ]
                        h 'p', "#{d.bottom} - #{d.top} m"
                        if d.surface then h('p', ["Surface: ", h('code',d.surface)]) else null
                      ]
                      timeout: 2000
                    }
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

  componentDidMount: =>
    window.resizers.push @

  componentDidUpdate: =>

SVGSectionComponent = withRouter(BaseSVGSectionComponent)

module.exports = {BaseSVGSectionComponent, SVGSectionComponent}

