import {Component, createElement} from "react"
import {findDOMNode} from "react-dom"
import h from "react-hyperscript"
import {select} from "d3-selection"
import {scaleIdentity} from "d3-scale"
import {axisLeft} from 'd3-axis'

class SectionAxis extends Component
  @defaultProps: {
    scale: scaleIdentity()
    ticks: 4
  }
  render: ->
    h 'g.y.axis'
  componentDidUpdate: ->
    @yAxis
      .scale @props.scale
      .ticks @props.ticks
    select findDOMNode @
      .call @yAxis
  componentDidMount: ->
    @yAxis = axisLeft()
    @componentDidUpdate()

export {SectionAxis}
