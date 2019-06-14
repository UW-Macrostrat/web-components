import {Component} from "react"
import {findDOMNode} from "react-dom"
import h from "react-hyperscript"
import {select} from "d3-selection"
import {axisLeft} from 'd3-axis'
import {ColumnContext} from './context'

class SectionAxis extends Component
  @contextType: ColumnContext
  @defaultProps: {
    ticks: 4
  }
  render: ->
    h 'g.y.axis'
  componentDidUpdate: ->
    {scale} = @context
    @yAxis
      .scale scale
      .ticks @props.ticks
    select findDOMNode(@)
      .call @yAxis
  componentDidMount: ->
    @yAxis = axisLeft()
    @componentDidUpdate()

export {SectionAxis}
