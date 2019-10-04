import {Component, useContext} from 'react'
import {GrainsizeAxis} from '@macrostrat/column-components/src/grainsize'
import {
  LithologyColumn,
  LithologyColumnInner,
  GeneralizedSectionColumn,
  CoveredOverlay,
  FaciesColumnInner
} from "@macrostrat/column-components/src/lithology"
import {StatefulComponent} from '@macrostrat/ui-components'
import {IntervalEditor} from "./editor"
import {SymbolColumn} from "@macrostrat/column-components/src/symbol-column"
import {SVG, ForeignObject} from '@macrostrat/column-components/src/util'
import {ColumnAxis} from '@macrostrat/column-components/src/axis'
import {ColumnProvider, ColumnContext,
        FaciesProvider, AssetPathContext} from '@macrostrat/column-components/src/context'
import {DivisionEditOverlay} from '@macrostrat/column-components/src/edit-overlay'
import "~/column-components/src/main.styl"
import h from '~/hyper'
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

    h 'div.column-container', [
      h DivisionEditOverlay, {
        top: @props.margin.top
        left: @props.margin.left
        allowEditing: true
        width: 200
        onClick: @props.onEditInterval
      }
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
        h GrainsizeAxis, {range: [80, 150]}
      ]
    ]

resolveLithologySymbol = (id)->
  if assetPaths[id]?
    return assetPaths[id]
  return null

resolveSymbol = (id)->

class EditableStratColumn extends StatefulComponent
  constructor: ->
    super arguments...
    @state = {
      surfaces: @props.initialSurfaces or []
      editingInterval: null
      clickedHeight: null
    }
  render: ->
    {editingInterval, clickedHeight} = @state
    {data} = @props
    {surfaces} = data
    console.log surfaces

    h ColumnProvider, {
      divisions: surfaces,
      width: 150
      grainsizeScaleStart: 80
      range: [0,data.height],
      pixelsPerMeter: 10
    }, [
      h StratColumn, {
        onEditInterval: @onEditInterval
      }
      h 'div.interval-editor', [
        h IntervalEditor, {
          interval: editingInterval
          height: clickedHeight
        }
      ]
    ]

  onEditInterval: ({height, division})=>
    @updateState {
      editingInterval: {$set: division}
      clickedHeight: {$set: height}
    }

__StratOuter = (props)->
  value = {resolveLithologySymbol, resolveSymbol}
  h AssetPathContext.Provider, {value}, [
    h FaciesProvider, {initialFacies: defaultFacies}, [
      h EditableStratColumn, props
    ]
  ]

export {__StratOuter as StratColumn}
