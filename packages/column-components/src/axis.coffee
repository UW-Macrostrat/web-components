import {Component} from "react"
import {findDOMNode} from "react-dom"
import h from "react-hyperscript"
import {select} from "d3-selection"
import {axisLeft} from 'd3-axis'
import {ColumnContext} from './context'

class ColumnAxis extends Component
  @contextType: ColumnContext
  # https://github.com/d3/d3-axis
  @__d3axisKeys: [
    'ticks',
    'tickArguments'
    'tickValues',
    'tickFormat'
    'tickSize'
    'tickSizeInner'
    'tickSizeOuter'
    'tickPadding'
  ]
  @defaultProps: {
    ticks: 4
    showLabel: -> true
    showDomain: true
  }
  render: ->
    h 'g.y.axis'
  componentDidUpdate: ->
    {scale} = @context
    {showLabel} = @props
    @yAxis.scale scale

    for k in @constructor.__d3axisKeys
      continue unless @props[k]?
      @yAxis[k](@props[k])

    ax = select findDOMNode(@)
      .call @yAxis

    if not @props.showDomain
      ax.select(".domain").remove()

    # Hide labels if they match the showLabel predicate
    ax.selectAll ".tick text"
      .each (d)->
        v = showLabel(d)
        return if v
        select(@).attr "visibility", "hidden"

  componentDidMount: ->
    @yAxis = axisLeft()
    @componentDidUpdate()

export {ColumnAxis}
