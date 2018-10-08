d3 = require 'd3'
require 'd3-selection-multi'
h = require 'react-hyperscript'
{findDOMNode} = require 'react-dom'
Measure = require('react-measure').default
{Component, createElement, createRef} = require 'react'

{BaseSVGSectionComponent} = require '../summary-sections/column'
{SectionAxis} = require '../column/axis'
{SymbolColumn} = require '../column/symbol-column'
{FloodingSurface, TriangleBars} = require '../column/flooding-surface'
{LithologyColumn, CoveredColumn, GeneralizedSectionColumn} = require '../column/lithology'
{Notification} = require '../../notify'
{FaciesContext} = require '../facies-descriptions'
{SVGNamespaces} = require '../util'


class GeneralizedSVGSection extends BaseSVGSectionComponent
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
    marginRight = 0

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
                }
              h SectionAxis, {scale, ticks: nticks}
            ]
          ]
      ]
    ]

module.exports = {GeneralizedSVGSection}
