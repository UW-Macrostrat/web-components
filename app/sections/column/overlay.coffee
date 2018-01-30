{Component, createElement} = require 'react'
{findDOMNode} = require 'react-dom'
{GrainsizeScale} = require './grainsize'
{SymbolColumn} = require './symbol-column'
Samples = require './samples'
FloodingSurfaces = require './flooding-surfaces'
h = require 'react-hyperscript'
d3 = require 'd3'
{LithologyColumn, GeneralizedSectionColumn} = require './lithology'

class SectionAxis extends Component
  @defaultProps: {
    scale: d3.scaleIdentity()
    ticks: 4
  }
  render: ->
    h 'g.y.axis'
  componentDidUpdate: ->
    @yAxis
      .scale @props.scale
      .ticks @props.ticks
    d3.select findDOMNode @
      .call @yAxis
  componentDidMount: ->
    @yAxis = d3.axisLeft()
    @componentDidUpdate()

class SectionOverlay extends Component
  @defaultProps:
    padding: 30
  constructor: (props)->
    super props
    @state = lithologyData: null

  render: ->
    console.log "Rendering overlay for section #{@props.id}"

    #@yAxis.scale(@props.scale)
    transform = "translate(#{@props.padding.left} #{@props.padding.top})"

    {lithologyWidth, zoom, id, scale, ticks} = @props

    range = [128,208].map (d)->d-40
      .map (d)->d*zoom
      .map (d)->d+lithologyWidth

    gs = null
    samples = null


    __ = [
        h SectionAxis, {scale, ticks}
        h LithologyColumn, {
          width: lithologyWidth
          height: @props.innerHeight
          scale
          id
        }
    ]
    if zoom > 0.4
      __.push h GrainsizeScale, {
        height: @props.innerHeight
        range
      }

      if @props.showGeneralizedSections
        __.push h GeneralizedSectionColumn, {
          scale
          id
          grainsizeScaleStart: range[0]-lithologyWidth
          width: range[1]-lithologyWidth
          left: lithologyWidth
          height: @props.innerHeight
        }

      if @props.showCarbonIsotopes
        __.push h Samples, {scale, zoom, id}

      if @props.showFloodingSurfaces
        __.push h FloodingSurfaces, {scale, zoom, id}

      if @props.showSymbols
        __.push h SymbolColumn, {scale, id, left: 215}

    h "svg.overlay", {
      width: @props.outerWidth
      height: @props.outerHeight
    }, [
      h 'g.backdrop', {transform}, __
    ]

  createAxisLines: =>
    g = @backdrop.append 'g'
      .attrs class: 'y graticule'

    r = @props.range
    g.selectAll 'line'
      .data [r[0]..r[1]]
      .enter()
        .append('line')
        .attrs (d)=>
          y = @props.scale(d)
          {x1: 0, x2: @props.innerWidth, y1: y, y2: y}


module.exports = {SectionOverlay, SectionAxis}
