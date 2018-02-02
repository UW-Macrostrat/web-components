{Component, createElement} = require 'react'
{findDOMNode} = require 'react-dom'
h = require 'react-hyperscript'
d3 = require 'd3'

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

module.exports = {SectionAxis}
