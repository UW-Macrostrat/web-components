{Component, createElement} = require 'react'
{findDOMNode} = require 'react-dom'
GrainsizeScale = require './grainsize'
h = require 'react-hyperscript'
d3 = require 'd3'

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

    {lithologyWidth, zoom} = @props

    range = [128,208].map (d)->d-40
      .map (d)->d*zoom
      .map (d)->d+lithologyWidth

    gs = null
    if @props.zoom > 0.4
      gs = h GrainsizeScale, {
        height: @props.innerHeight
        range: range
      }


    h "svg.overlay", {
      width: @props.outerWidth
      height: @props.outerHeight
    }, [
      h 'g.backdrop', {transform}, [
        h 'g.y.axis'
        gs
      ]
    ]

  componentDidMount: ->
    _el = findDOMNode @
    el = d3.select _el

    @backdrop = el.select '.backdrop'

    @yAxis = d3.axisLeft()
      .scale(@props.scale)
      .ticks(@props.ticks)

    @backdrop.select '.y.axis'
      .call @yAxis

  componentDidUpdate: ->
    console.log @props.ticks
    console.log "Section #{@props.id} was updated"
    @yAxis
      .scale @props.scale
      .ticks @props.ticks
    @backdrop.select '.y.axis'
       .call @yAxis

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


module.exports = SectionOverlay
