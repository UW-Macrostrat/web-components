{Component} = require 'react'
h = require 'react-hyperscript'

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

fmt = d3.format('.1f')

class LithostratigraphyColumn extends Component
  render: ->
    {divisions, scale} = @props
    console.log divisions
    h 'g.lithostratigraphy'

class BaseSVGSectionComponent extends BaseSectionComponent
  @defaultProps: {
    BaseSectionComponent.defaultProps...
    trackVisibility: false
    innerWidth: 100
    height: 100 # Section height in meters
    lithologyWidth: 40
    showFacies: true
    showFloodingSurfaces: true
    onResize: ->
    marginLeft: -90
    padding:
      left: 30
      top: 10
      right: 10
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

  render: ->
    {id, zoom, padding, lithologyWidth,
     innerWidth, onResize, marginLeft,
     showFacies, height, clip_end} = @props

    innerHeight = height*@props.pixelsPerMeter*@props.zoom

    {left, top, right, bottom} = padding

    tbo = 80
    if @props.showTriangleBars
      left += tbo

    scaleFactor = @props.scaleFactor/@props.pixelsPerMeter

    @state.scale.range [innerHeight, 0]
    outerHeight = innerHeight+(top+bottom)
    outerWidth = innerWidth+(left+right)

    {heightOfTop} = @props
    marginTop = heightOfTop*@props.pixelsPerMeter*@props.zoom

    [bottom,top] = @props.range

    txt = id

    {scale,visible, divisions} = @state
    divisions = divisions.filter (d)->not d.schematic
    zoom = @props.zoom

    {skeletal} = @props

    # Set up number of ticks
    nticks = (height*@props.zoom)/10

    style = {
      width: outerWidth
      height: outerHeight
      marginLeft
    }

    transform = "translate(#{left} #{@props.padding.top})"

    minWidth = outerWidth
    h "div.section-container", {
      className: if @props.skeletal then "skeleton" else null
      style: {minWidth}
    }, [
      h 'div.section-outer', [
        h "svg.section", {style}, [
          h 'g.backdrop', {transform}, [
            h SectionAxis, {scale, ticks: nticks}
            h LithostratigraphyColumn, {scale, divisions}
          ]
        ]
      ]
    ]


class LithostratKey extends Component
  render: ->
    h 'div.align-with-sections', {style: {marginLeft: 20}}, [
      h BaseSVGSectionComponent, @props
    ]

module.exports = {LithostratKey}
