import {Component, useContext} from 'react'
import {ColumnProvider, ColumnContext} from './context'
import {GrainsizeAxis} from './grainsize-axis'
import {ColumnAxis} from './axis'
import h from '@macrostrat/hyper'
import T from 'prop-types'

ColumnSVG = (props)->
  {width: innerWidth, margin, children, rest...} = props
  {pixelHeight} = useContext(ColumnContext)
  {left, right, top, bottom} = margin
  height = pixelHeight+(top+bottom)
  width = innerWidth+(left+right)
  h 'svg', {width, height, rest...}, (
    h 'g', {
      transform: "translate(#{left},#{top})"
    }, children
  )

class StratColumn extends Component
  @defaultProps: {
    margin: {
      left: 30
      top: 30
      right: 0
      bottom: 30
    }
  }
  render: ->
    {margin} = @props
    h ColumnProvider, {
      surfaces: [],
      range: [0,100],
      pixelsPerMeter: 10
    }, [
      h ColumnSVG, {width: 200, margin}, [
        h ColumnAxis
        h GrainsizeAxis, {range: [50, 150]}
      ]
    ]

export {StratColumn}
