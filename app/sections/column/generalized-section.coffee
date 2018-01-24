d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
{findDOMNode} = require 'react-dom'
d3 = require 'd3'
h = require 'react-hyperscript'

class GrainsizeScale extends Component
  @defaultProps:
    sizes: ['ms','s','vf','f','m','c','vc','p']
    height: 20
  constructor: (props)->
    super props

  render: ->
    mn = @props.sizes.length-1
    scale = d3.scaleLinear()
      .domain [0,mn]
      .range @props.range

    grainsizeScale = d3.scaleOrdinal()
      .domain @props.sizes
      .range @props.sizes.map (d,i)=>scale(i)


    h 'g.grainsize.axis', @props.sizes.map (d)=>
      sc = grainsizeScale(d)
      h 'g.tick', transform: "translate(#{sc} 0)", key: d, [
        h 'text.top', {y: 0}, d
        h 'text.bottom', {y: @props.height}, d
        h 'line', {y1: 0, x1: 0, x2: 0, y2: @props.height}
      ]

module.exports = GrainsizeScale
