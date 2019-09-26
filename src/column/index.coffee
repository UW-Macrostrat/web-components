import {Component, useContext} from 'react'
import {GrainsizeAxis} from '~/column-components/grainsize'
import {
  LithologyColumn,
  SimplifiedLithologyColumn,
  GeneralizedSectionColumn,
  CoveredOverlay
} from "~/column-components/lithology"
import {ColumnAxis} from '~/column-components/axis'
import {ColumnProvider, ColumnContext, FaciesProvider} from '~/column-components/context'
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
      width: 150
      grainsizeScaleStart: 50
      range: [0,100],
      pixelsPerMeter: 10
    }, [
      h ColumnSVG, {width: 200, margin}, [
        h GeneralizedSectionColumn, {
          width: innerWidth
        }, [
          h CoveredOverlay, {width: innerWidth}
          h SimplifiedLithologyColumn, {width: innerWidth}
        ]
        h ColumnAxis
        h GrainsizeAxis, {range: [50, 150]}
      ]
    ]


__StratOuter = (props)->
  h FaciesProvider, null, [
    h StratColumn, props
  ]

export {__StratOuter as StratColumn}
