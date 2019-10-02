import {Component, useContext} from 'react'
import {GrainsizeAxis} from '~/column-components/grainsize'
import {
  LithologyColumn,
  LithologyColumnInner,
  GeneralizedSectionColumn,
  CoveredOverlay,
  FaciesColumnInner
} from "~/column-components/lithology"
import {SymbolColumn} from "~/column-components/symbol-column"
import {SVG} from '~/column-components/util'
import {ColumnAxis} from '~/column-components/axis'
import {ColumnProvider, ColumnContext,
        FaciesProvider, AssetPathContext} from '~/column-components/context'
import "~/column-components/main.styl"
import h from '@macrostrat/hyper'
import T from 'prop-types'
import defaultFacies from './default-facies'
import assetPaths from "../../sed-patterns/*.svg"
console.log assetPaths
ColumnSVG = (props)->
  {width: innerWidth, margin, children, rest...} = props
  {pixelHeight} = useContext(ColumnContext)
  {left, right, top, bottom} = margin
  height = pixelHeight+(top+bottom)
  width = innerWidth+(left+right)
  h SVG, {
    width,
    height,
    className: 'section'
    rest...
  }, (
    h 'g.backdrop', {
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
    showFacies: false
  }
  render: ->
    {margin, showFacies, surfaces} = @props

    h ColumnProvider, {
      divisions: surfaces,
      width: 150
      grainsizeScaleStart: 80
      range: [0,100],
      pixelsPerMeter: 10
    }, [
      h ColumnSVG, {width: 200, margin}, [
        h GeneralizedSectionColumn, [
          h.if(showFacies) FaciesColumnInner, {width: innerWidth}
          h CoveredOverlay, {width: innerWidth}
          h LithologyColumnInner, {
            width: innerWidth
          }
        ]
        h SymbolColumn, {left: 90}
        h ColumnAxis
        h GrainsizeAxis, {range: [50, 150]}
      ]
    ]

resolveLithologySymbol = (id)->
  if assetPaths[id]?
    return assetPaths[id]
  return null


resolveSymbol = (id)->

__StratOuter = (props)->
  value = {resolveLithologySymbol, resolveSymbol}
  h AssetPathContext.Provider, {value}, [
    h FaciesProvider, {initialFacies: defaultFacies}, [
      h StratColumn, props
    ]
  ]

export {__StratOuter as StratColumn}
