d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
{findDOMNode} = require 'react-dom'
d3 = require 'd3'
h = require 'react-hyperscript'

grainSizes = ['ms','s','vf','f','m','c','vc','p']
createGrainsizeScale = (range)->
  mn = grainSizes.length-1
  scale = d3.scaleLinear()
    .domain [0,mn]
    .range range
  d3.scaleOrdinal()
    .domain grainSizes
    .range grainSizes.map (d,i)=>scale(i)

class GrainsizeScale extends Component
  @defaultProps:
    height: 20
  constructor: (props)->
    super props

  render: ->
    gs = createGrainsizeScale(@props.range)
    sizes = gs.domain()
    h 'g.grainsize.axis', sizes.map (d)=>
      h 'g.tick', transform: "translate(#{gs(d)} 0)", key: d, [
        h 'text.top', {y: 0}, d
        h 'text.bottom', {y: @props.height}, d
        h 'line', {y1: 0, x1: 0, x2: 0, y2: @props.height}
      ]

module.exports = {GrainsizeScale, grainSizes, createGrainsizeScale}
