{BaseSVGSectionComponent} = require './column'
{withRouter} = require 'react-router-dom'
{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
Measure = require('react-measure').default
{SectionAxis} = require '../column/axis'
{query} = require '../db'
{sectionSurfaceProps} = require './link-overlay'
{SVGNamespaces} = require '../util'
classNames = require 'class-names'
chroma = require 'chroma-js'

fmt = d3.format('.1f')

class IsotopesComponent extends Component
  @defaultProps: {
    visible: false
    label: 'δ¹³C'
    system: 'delta13c'
    trackVisibility: true
    innerWidth: 150
    offsetTop: null
    showLines: false
    surfaces: null
    xRatio: 6
    height: 100 # Section height in meters
    pixelsPerMeter: 2
    domain: [-15,6]
    padding:
      left: 10
      top: 10
      right: 10
      bottom: 30
  }

  constructor: (props)->
    super props
    {system} = @props
    @state = {
      scale: d3.scaleLinear().domain(@props.range)
      xScale: d3.scaleLinear().domain(@props.domain)
      cscale: d3.scaleOrdinal(d3.schemeCategory10)
      isotopes: []
    }

    column = 'avg_'+system
    @line = d3.line()
      .x (d)=>@state.xScale(d[column])
      .y (d)=>@state.scale(d.height)

    query('carbon-isotopes')
      .then @setupData

  setupData: (isotopes)=>
    isotopes = d3.nest()
      .key (d)->d.section
      .entries isotopes
    @setState {isotopes}

  render: ->
    {id, zoom, padding,
     onResize,
     marginLeft, height, clip_end} = @props
    innerHeight = height*@props.pixelsPerMeter

    {left, top, right, bottom} = padding

    scaleFactor = @props.scaleFactor/@props.pixelsPerMeter
    [mn,mx] = @props.domain
    innerWidth = (mx-mn)*@props.xRatio

    @state.scale.range [innerHeight, 0]
    @state.xScale.range [0, innerWidth]
    outerHeight = innerHeight+(top+bottom)
    outerWidth = innerWidth+(left+right)

    {heightOfTop} = @props
    marginTop = heightOfTop*@props.pixelsPerMeter*@props.zoom

    [bottom,top] = @props.range

    txt = id

    {scale,visible, divisions} = @state
    zoom = @props.zoom

    size = {
      width: outerWidth
      height: outerHeight
    }

    {label} = @props

    transform = "translate(#{@props.padding.left} #{@props.padding.top})"

    minWidth = outerWidth
    h "div.isotopes", {
      className: if @props.skeletal then "skeleton" else null
    }, [
      h 'div.section-header.subtle', [
        h "h2", {style: {height: '1.2rem'}},label
      ]
      h 'div.section-outer', [
        h Measure, {
          bounds: true,
          client: true,
          onResize: @onResize
        }, ({measureRef})=>
          h "svg.section", {
            SVGNamespaces...
            size...
            ref: measureRef
          }, [
            h 'g.backdrop', {transform}, [
              @renderScale()
              @renderAxisLines()
              @renderData()
            ]
          ]
      ]
    ]

  locatePoint: (d, s=0)=>
    {system} = @props
    v = d['avg_'+system]
    unless s == 0
      v += d['std_'+system]*s
    [
      @state.xScale(v)
      @state.scale(parseFloat(d.height))
    ]

  renderAxisLines: =>
    getHeight = (d)->
      {height} = d.section_height.find (v)->v.section == 'J'
      return height

    {surfaces} = @props
    return null unless surfaces?
    surfaces = surfaces.filter (d)->d.type == 'sequence-strat'
    h 'g.surfaces', {style: {strokeOpacity: 0.3}}, surfaces.map (d)=>
      try
        height = getHeight(d)
      catch
        # No height for section J. We should create a more
        # robust solution to this problem in the SQL code.
        return null

      y = @state.scale(height)
      h 'line', {
        x1: -500
        x2: 500
        transform: "translate(0, #{y})"
        sectionSurfaceProps(d)...
      }

  renderData: =>
    {isotopes, cscale, scale, xScale} = @state
    h 'g.data', isotopes.map ({key, values}, i)=>
      [x,y] = @locatePoint values[values.length-1]
      transform = "translate(#{x},#{y})"
      fill = stroke = cscale(i)

      line = null
      if @props.showLines
        lineValues = values.filter (d)->d.in_zebra_nappe
        d = @line(lineValues)
        line = h 'path', {d, stroke, fill:'transparent'}
      h 'g.section-data', {key}, [
        @renderValues(values, fill)
        line
        h 'text', {transform, x:10,y:5,fill}, key
      ]

  renderValues: (entries, stroke)=>
    {scale, xScale} = @state
    h 'g.data-points', entries.map (d)=>
      [x1,y1] = @locatePoint(d, -2)
      [x2,y2] = @locatePoint(d, 2)

      actualStroke = stroke
      if not d.in_zebra_nappe
        actualStroke = chroma(stroke).brighten(2).css()

      h 'line', {
        key: d.id
        x1,y1,x2,y2,
        stroke: actualStroke
        strokeWidth: 8
        strokeLinecap: 'round'
      }

  renderScale: =>
    {height} = @props
    {xScale, scale} = @state
    v = xScale.ticks()
    h 'g.scale', v.map (d)->
      x = xScale(d)
      y = scale(0)
      transform = "translate(#{x})"
      className = classNames {zero: d == 0}
      h 'g.tick', {transform, className, key: d}, [
        h 'line', {x0: 0, x1: 0, y0: 0, y1: y}
        h 'text', {y: y+12}, "#{d}"
      ]

module.exports = {IsotopesComponent}
