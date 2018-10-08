d3 = require 'd3'
require 'd3-selection-multi'
h = require 'react-hyperscript'
{findDOMNode} = require 'react-dom'
Measure = require('react-measure').default
{Component, createElement, createRef} = require 'react'

{BaseSVGSectionComponent} = require '../summary-sections/column'
{SectionAxis} = require '../column/axis'
{GeneralizedSectionColumn} = require '../column/lithology'
{FaciesContext} = require '../facies-descriptions'
{SVGNamespaces} = require '../util'

class GeneralizedSVGSection extends Component
  @defaultProps: {pixelsPerMeter: 20, zoom: 1}
  constructor: (props)->
    super props
    @state = {
      scale: d3.scaleLinear().domain(@props.range)
    }
    @state.scale.clamp()

  render: ->
    {id, zoom, padding, lithologyWidth,
     innerWidth, onResize, marginLeft,
     left,
     showFacies, height, clip_end, offset, offsetTop
     showTriangleBars,
     showFloodingSurfaces,
     divisions
     } = @props

    left ?= 0 # Position relative to left margin

    innerHeight = height*@props.pixelsPerMeter*@props.zoom

    @state.scale.range [innerHeight, 0]
    outerHeight = innerHeight
    outerWidth = innerWidth
    innerWidth = 50

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

    {scale,visible} = @state
    divisions = divisions.filter (d)->not d.schematic

    {skeletal} = @props
    top = 0

    # Set up number of ticks
    nticks = (height*@props.zoom)/10
    marginRight = 0

    style = {
      width: outerWidth
      height: outerHeight
      marginLeft
      marginRight
    }

    transform = "translate(#{left} #{top})"

    minWidth = outerWidth
    position = 'absolute'

    h "g.section", {style, transform}, [
      h FaciesContext.Consumer, {}, ({facies})=>
        h GeneralizedSectionColumn, {
          width: innerWidth
          height: innerHeight
          facies: facies
          divisions
          showFacies
          showCoveredOverlay: true
          scale
          id
          grainsizeScaleStart: 40
        }
    ]

module.exports = {GeneralizedSVGSection}
