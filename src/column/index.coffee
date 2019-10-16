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
        FaciesProvider, AssetPathContext,
        GrainsizeLayoutProvider
        ColumnImage
} from '@macrostrat/column-components'
import {DivisionEditOverlay} from '@macrostrat/column-components/src/edit-overlay'
import "~/column-components/src/main.styl"
import h from '~/hyper'
import T from 'prop-types'
import defaultFacies from './default-facies'
import assetPaths from "../../sed-patterns/*.svg"
import testImage from '../../example-data/Naukluft-Section-J.png'
import {NotesColumn} from '@macrostrat/column-components/src/notes'

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
      right: 10
      bottom: 30
    }
    showFacies: false
  }
  render: ->
    {margin, showFacies, notes} = @props
    lithologyWidth = 40
    columnWidth = 212
    grainsizeScaleStart = 132
    notesWidth = 500
    notesOffset = columnWidth+10

    h 'div.column-container', [
      h GrainsizeLayoutProvider, {width: columnWidth, grainsizeScaleStart}, [
        h ColumnImage, {
          left: @props.margin.left+lithologyWidth
          top: @props.margin.top
          src: testImage
        }
        h DivisionEditOverlay, {
          top: @props.margin.top
          left: @props.margin.left
          allowEditing: true
          width: 200
          onClick: @props.onEditInterval
        }
        h ColumnSVG, {
          width: notesOffset+notesWidth,
          margin,
          style: {zIndex: 10, position: 'relative'}
        }, [
          h LithologyColumn, {width: lithologyWidth}, [
            h.if(showFacies) FaciesColumnInner, {width: innerWidth}
            h CoveredOverlay, {width: innerWidth}
            h LithologyColumnInner, {
              width: innerWidth
            }
          ]
          h SymbolColumn, {left: 90}
          h ColumnAxis
          h GrainsizeAxis
          h NotesColumn, {
            notes,
            transform: "translate(#{notesOffset})",
            width: notesWidth
          }
        ]
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
    {surfaces, notes} = data

    h ColumnProvider, {
      divisions: surfaces,
      range: [0,data.height],
      pixelsPerMeter: 20
    }, [
      h StratColumn, {
        onEditInterval: @onEditInterval
        notes
      }
      h IntervalEditor, {
        interval: editingInterval
        height: clickedHeight
        closeDialog: @cancelEditInterval
      }
    ]

  onEditInterval: ({height, division})=>
    @updateState {
      editingInterval: {$set: division}
      clickedHeight: {$set: height}
    }

  cancelEditInterval: =>
    @updateState {editingInterval: {$set: null}}

__StratOuter = (props)->
  value = {resolveLithologySymbol, resolveSymbol}
  h AssetPathContext.Provider, {value}, [
    h FaciesProvider, {initialFacies: defaultFacies}, [
      h EditableStratColumn, props
    ]
  ]

export {__StratOuter as StratColumn}
