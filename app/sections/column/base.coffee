{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
Measure = require('react-measure').default
{SectionOverlay, SectionAxis} = require './overlay'
{LithologyColumn, CoveredColumn, GeneralizedSectionColumn} = require './lithology'
require './main.styl'

class BaseSectionComponent extends Component
  @defaultProps: {
    zoom: 1
    pixelsPerMeter: 20
    skeletal: false
    offset: 0
    offsetTop: null
    useRelativePositioning: true
  }
  constructor: (props)->
    super props

  componentDidMount: ->
    @componentDidUpdate.apply @, arguments

  componentDidUpdate: ->
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
    console.log "Section #{@props.id}: offset #{heightOfTop} m, desired #{desiredPosition} px"

    # Set alignment
    offs = 0
    sib = el.previousSibling
    if sib?
      {top} = el.parentElement.getBoundingClientRect()
      {bottom} = sib.getBoundingClientRect()
      offs = bottom-top

    el.style.marginTop = "#{desiredPosition-offs}px"

class SVGSectionComponent extends BaseSectionComponent
  @defaultProps: {
    BaseSectionComponent.defaultProps...
    trackVisibility: false
    innerWidth: 150
    height: 100 # Section height in meters
    lithologyWidth: 40
    logWidth: 350
    containerWidth: 1000
    padding:
      left: 30
      top: 30
      right: 30
      bottom: 30
  }
  constructor: (props)->
    super props
    @state =
      visible: not @props.trackVisibility
      scale: d3.scaleLinear().domain(@props.range)

  render: ->
    {id, zoom, padding, lithologyWidth, innerWidth, onResize} = @props

    innerHeight = @props.height*@props.pixelsPerMeter*@props.zoom

    {left, top, right, bottom} = padding

    scaleFactor = @props.scaleFactor/@props.pixelsPerMeter

    @state.scale.range [innerHeight, 0]
    outerHeight = innerHeight+(top+bottom)
    outerWidth = innerWidth+(left+right)

    {heightOfTop} = @props
    marginTop = heightOfTop*@props.pixelsPerMeter*@props.zoom

    [bottom,top] = @props.range

    txt = id

    {scale,visible} = @state
    zoom = @props.zoom

    {skeletal} = @props

    # Set up number of ticks
    nticks = (@props.height*@props.zoom)/10

    style = {
      width: outerWidth
      height: outerHeight
      xmlns: "http://www.w3.org/2000/svg"
    }

    transform = "translate(#{@props.padding.left} #{@props.padding.top})"

    minWidth = outerWidth
    h "div.section-container", {
      className: if @props.skeletal then "skeleton" else null
      style: {minWidth}
    }, [
      h 'div.section-header', [h "h2", txt]
      h 'div.section-outer', [
        h Measure, {bounds: true, onResize}, ({measureRef})=>
          h "svg.section", {style, ref: measureRef}, [
            h 'g.backdrop', {transform}, [
              h CoveredColumn, {
                height: innerHeight
                scale
                id
                width: 6
              }
              h GeneralizedSectionColumn, {
                width: 100
                height: innerHeight
                scale
                id
                grainsizeScaleStart: 40
              }
              h SectionAxis, {scale, ticks: nticks}
            ]
          ]
      ]
    ]

module.exports = {BaseSectionComponent, SVGSectionComponent}
