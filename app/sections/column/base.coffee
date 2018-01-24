{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
{SectionOverlay, SectionAxis} = require './overlay'
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
    innerWidth: 280
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
    {id, zoom, padding} = @props

    innerHeight = @props.height*@props.pixelsPerMeter*@props.zoom

    {left, top, right, bottom} = padding

    scaleFactor = @props.scaleFactor/@props.pixelsPerMeter

    @state.scale.range [innerHeight, 0]
    outerHeight = innerHeight+(top+bottom)
    innerWidth = @props.innerWidth*@props.zoom
    if innerWidth < @props.lithologyWidth
      innerWidth = @props.lithologyWidth

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

    innerElements = []

    if @state.visible
      _ = h SectionOverlay, {
        id
        height: @props.height
        range: @props.range
        padding
        lithologyWidth: @props.lithologyWidth
        ticks: nticks
        innerHeight
        outerHeight
        innerWidth
        outerWidth
        scale
        skeletal
        zoom
        showCarbonIsotopes: @props.showCarbonIsotopes
        showFloodingSurfaces: @props.showFloodingSurfaces
      }
      innerElements.push _

    style = {
      width: outerWidth
      height: outerHeight
    }

    children= [
      h 'div.section-header', [h "h2", txt]
      h 'div.section-outer', [
        h 'div.section', {style}, innerElements
      ]
    ]

    width = outerWidth
    mainElement = h "div.section-container",
      className: if @props.skeletal then "skeleton" else null
      style:
        minWidth: width
      children

    return mainElement

  log: ->

  onVisibilityChange: (isVisible)=>
    return if isVisible == @state.visible
    console.log "Section visibility changed"
    @setState visible: isVisible

    # I'm not sure why this works but it does


module.exports = {BaseSectionComponent, SVGSectionComponent}
