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

  renderWhiteUnderlay: ->
    {innerWidth, padding, marginLeft} = @props
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
    return h 'rect.underlay', {
      width: outerWidth-55
      height: innerHeight+10
      x
      y: -5
      fill: 'white'
    }

  __doUpdate: ->
    # This leads to some problems unsurprisingly
    el = findDOMNode @

    {scale} = @state
    {height, zoom, offset, offsetTop} = @props
    pixelsPerMeter = Math.abs(scale(1)-scale(0))

    # If we're not moving sections from the top, don't mess with positioning
    # at runtime
    return unless @props.useRelativePositioning

    offsetTop ?= 670-height-offset
    heightOfTop = offsetTop
    desiredPosition = heightOfTop*pixelsPerMeter

    # Set alignment
    offs = 0
    sib = el.previousSibling
    if sib?
      {top} = el.parentElement.getBoundingClientRect()
      {bottom} = sib.getBoundingClientRect()
      offs = bottom-top

    el.style.marginTop = "#{desiredPosition-offs}px"

  render: ->
    {id, zoom, padding, lithologyWidth,
     innerWidth, onResize, marginLeft,
     showFacies, height, clip_end,
     showTriangleBars,
     showFloodingSurfaces,
     position
     } = @props

    pos = position

    innerHeight = pos.heightScale.pixelHeight()

    {left, top, right, bottom} = padding

    scaleFactor = @props.scaleFactor/@props.pixelsPerMeter

    @state.scale.range [innerHeight, 0]
    outerHeight = innerHeight+(top+bottom)
    outerWidth = innerWidth+(left+right)

    {heightOfTop} = @props
    marginTop = pos.heightScale.pixelOffset()

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

    # Expand SVG past bounds of section
    style = {
      width: outerWidth
      height: outerHeight
    }

    whiteUnderlay = false

    transform = "translate(#{left} #{@props.padding.top})"

    minWidth = outerWidth
    position = 'absolute'
    top = marginTop
    h "div.section-container", {
      className: if @props.skeletal then "skeleton" else null
      style: {minWidth, top, position}
    }, [
      h 'div.section-header', [
        h("h2", txt)]
      h 'div.section-outer', [
        h "svg.section", {
          SVGNamespaces...
          style
        }, [
          h 'g.backdrop', {transform}, [
            if whiteUnderlay then @renderWhiteUnderlay() else null
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

SVGSectionComponent = withRouter(BaseSVGSectionComponent)

module.exports = {BaseSVGSectionComponent, SVGSectionComponent}

