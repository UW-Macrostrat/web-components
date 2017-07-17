{Component, createElement} = require 'react'
{findDOMNode} = require 'react-dom'
createGrainsizeScale = require 'stratigraphic-column/src/grainsize'

class SectionOverlay extends Component
  @defaultProps:
    padding: 30
  constructor: (props)->
    super props
    @state = lithologyData: null

  render: ->
    console.log "Rendering overlay for section #{@props.id}"

    #@yAxis.scale(@props.scale)

    h "svg.overlay", style: {
      width: @props.outerWidth
      height: @props.outerHeight
    }

  componentDidMount: ->
    _el = findDOMNode @
    el = d3.select _el

    @backdrop = el.append 'g'
      .attrs class: 'backdrop'

    @createAxes()
    #@createLithologyColumn()

  componentDidUpdate: ->
    console.log "Section #{@props.id} was updated"
    @yAxis.scale @props.scale
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

  createAxes: =>
    @yAxis = d3.axisLeft()
      .scale(@props.scale)
      .ticks(@props.height//10)

    @backdrop
      .attr 'transform', "translate(#{@props.padding.left} #{@props.padding.top})"

    @backdrop.append('g')
      .attrs class: 'y axis'
      .call @yAxis

    @x = d3.scaleLinear()
      .domain [0,14] #blocks
      .range [0, @props.innerWidth]

    g = @backdrop.append 'g'
    createGrainsizeScale g.node(), {
      scale: @props.scale
      height: @props.innerHeight
      range: [118,198]
    }

  createLithologyColumn: =>

    defs = @backdrop
      .append 'defs'

    defs.append 'rect'
      .attrs
        id: 'lithology-column'
        height: @props.innerHeight
        width: @props.lithologyWidth
        x: @x(0)
        y: 0

    defs.append 'clipPath'
      .attrs
        id: 'lithology-clip'
      .append 'use'
        .attrs href: '#lithology-column'

    lith = @backdrop.append 'g'
      .attrs class: 'dominant-lithology'

    el = lith.append 'g'
      .attrs
        class: 'container'
        'clip-path': "url(#lithology-clip)"

    createLithologyColumn el,
      id: @props.id
      width: @props.lithologyWidth
      scale: @props.scale

    lith.append 'use'
      .attrs
        class: 'neatline'
        href: '#lithology-column'

module.exports = SectionOverlay
