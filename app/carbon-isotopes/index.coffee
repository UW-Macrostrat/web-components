import {findDOMNode} from "react-dom"
import {Component} from "react"
import "./main.styl"
import * as d3 from "d3"
import "d3-selection-multi"
import "d3-jetpack"
import "d3-scale-chromatic"
import h from "react-hyperscript"

import {query} from "../sections/db"

class CarbonIsotopesPage extends Component
  @defaultProps:
    margin:
      top: 10
      bottom: 50
      left: 50
      right: 10
    size:
      width: 400
      height: 800
  constructor: (props)->
    super props
    @state =
      data: []
  render: ->
    h 'div#carbon-isotopes'

  innerSize: ->
    {width, height} = @props.size
    m = @props.margin
    return {
      width: width-m.left-m.right
      height: height-m.top-m.bottom
    }

  componentDidMount: ->
    query('carbon-isotopes')
      .then (rows)=>
        console.log rows
        @setState data: rows

    _el = findDOMNode @
    el = d3.select _el
      .append 'svg'
      .attrs @props.size

    {left, top} = @props.margin
    inner = el.append 'g'
      .attr 'transform', "translate(#{left} #{top})"

    {width, height} = @innerSize()

    @x = d3.scaleLinear()
      .domain [-16,10]
      .range [0,width]

    @y = d3.scaleLinear()
      .domain [-10,700]
      .range [height, 0]

    b = d3.axisBottom()
      .scale @x

    xax = inner.append 'g'
      .attrs
        class: 'scale x'
        transform: "translate(0 #{height})"

    xax.call b

    xax.append 'foreignObject'
      .translate [width/2, 20]
      .append 'xhtml:div'
      .html '∂<sup>13</sup>C'
      .attrs
        class: 'axis-label'

    gg = inner.append 'g.grid'
      .selectAll 'line'
      .data @x.ticks()
      .attrs class: 'grid'

    gg.enter()
      .append 'line'
      .translate (d)=>[@x(d),0]
      .classed 'zero', (d)->d == 0
      .attrs
        y0: 0
        y1: height

    left = d3.axisLeft()
      .scale @y

    yax = inner.append 'g'
      .attrs class: 'scale y'

    yax.call left

    yax.append 'foreignObject'
      .at
        transform: "translate(-50 #{height/2+150}) rotate(-90)"
        width: 350
      .append 'xhtml:div'
      .html 'Stratigraphic height (m) — <em>normalized to Section J</em>'
      .attrs
        class: 'axis-label'

    @dataArea = inner.append 'g'

  componentDidUpdate: (prevProps, prevState)->
    nested = d3.nest()
      .key (d)->d.section
      .entries @state.data

    cscale = d3.scaleOrdinal(d3.schemeCategory10)

    sel = @dataArea.selectAll 'circle'
        .data @state.data

    path = @dataArea.selectAll 'g.section'
      .data nested

    line = d3.line()

    esel = path.enter()
      .append 'g'

    locatePoint = (i)=>
      [@x(i.avg_delta13c), @y(parseFloat(i.height))]

    esel.append 'path'
      .attrs
        class: 'section'
        d: (d)=>
          arr = d.values.map locatePoint
          line(arr)
        fill: 'transparent'
        stroke: (d,i)->cscale(i)
        'stroke-width': 2

    esel.append 'text'
      .translate (d)=>
        v = d.values[d.values.length-1]
        locatePoint(v)
      .attrs
        x: 5
        y: 5
        fill: (d,i)->cscale(i)
      .text (d)->d.key

    x = @x
    y = @y
    esel.each (d,i)->
      sel = d3.select @
        .selectAll 'circle'
        .data d.values

      sel.enter()
        .append 'circle'
          .attrs
            cx: (d)=>x(d.avg_delta13c)
            cy: (d)=>y(parseFloat(d.height))
            fill: (d)->cscale(i)
            r: 2

export default CarbonIsotopesPage
