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
{query} = require '../../db'
{SVGNamespaces} = require '../util'

fmt = d3.format('.1f')

class LSLabel extends Component
  @defaultProps: { width: 20, extend: false}
  render: ->
    {y, name, width, extend} = @props
    x2 = if extend then width else 0
    h 'g.label', {transform: "translate(#{width},#{y})"}, [
      h 'line', {x1: -width, x2, y1: 0, y2: 0, stroke: '#888', strokeWidth: 2}
      h 'text', {transform: "rotate(-90) translate(5,-4)"}, name
    ]

class LithostratigraphyColumn extends Component
  constructor: (props)->
    super props
    @state = {names: []}
    query 'lithostratigraphy-names', null, {baseDir: __dirname}
      .then (names)=>
        @setState {names}

  render: ->
    {surfaces, scale} = @props
    {names} = @state

    surfaces = surfaces
      .filter (d)->d.type == 'lithostrat'
      .map (d)->
        {section_height, rest...} = d
        {height} = section_height.find (v)->v.section == 'J'
        {height, rest...}

    surfaces.sort (a,b)->a.height - b.height

    __formations = []
    __members = []
    for d in surfaces
      y = scale(d.height)
      transform = "translate(0,#{y}) rotate(-90)"
      surfaceData = names.find (v)->v.id == d.upper_unit
      continue unless surfaceData?
      if surfaceData.level == 3
        __formations.push h LSLabel, {y, name: surfaceData.short_name, extend: true}
        continue
      if d.commonality == 2
        __formations.push h LSLabel, {y, name: surfaceData.formation_short_name}

      __members.push h LSLabel, {y, name: surfaceData.short_name}

    h 'g.lithostratigraphy', [
      h 'g.formations', {style: {fontSize: 20}}, __formations
      h 'g.members', {transform: "translate(20)",style: {fontSize: 14, fontStyle: 'italic'}}, __members
    ]

class BaseSVGSectionComponent extends BaseSectionComponent
  @defaultProps: {
    BaseSectionComponent.defaultProps...
    trackVisibility: false
    innerWidth: 40
    height: 100 # Section height in meters
    lithologyWidth: 40
    showFacies: true
    showFloodingSurfaces: true
    onResize: ->
    marginLeft: 0
    padding:
      left: 5
      top: 10
      right: 5
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
     showFacies, height, clip_end, surfaces} = @props

    innerHeight = height*@props.pixelsPerMeter*@props.zoom

    {left, top, right, bottom} = padding

    scaleFactor = @props.scaleFactor/@props.pixelsPerMeter

    @state.scale.range [innerHeight, 0]
    outerHeight = innerHeight+(top+bottom)
    outerWidth = innerWidth+(left+right)

    {heightOfTop} = @props
    marginTop = heightOfTop*@props.pixelsPerMeter*@props.zoom

    [bottom,top] = @props.range

    txt = id

    {scale,visible, divisions} = @state

    zoom = @props.zoom

    {skeletal} = @props

    # Set up number of ticks
    nticks = (height*@props.zoom)/10

    style = {
      width: outerWidth
      height: outerHeight
      marginTop: 12
      marginLeft
    }

    transform = "translate(#{left} #{@props.padding.top})"

    minWidth = outerWidth
    h "div.section-container", {
      className: if @props.skeletal then "skeleton" else null
      style: {minWidth}
    }, [
      h 'div.section-outer', [
        h "svg.section", {style, SVGNamespaces...}, [
          h 'g.backdrop', {transform}, [
            h LithostratigraphyColumn, {scale, divisions, surfaces}
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
