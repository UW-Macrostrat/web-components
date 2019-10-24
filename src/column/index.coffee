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

MainColumn = ({generalized, lithologyWidth: width, rest...})->
  if generalized
    return h GeneralizedSectionColumn, rest
  return h LithologyColumn, {width, rest...}

class StratColumn extends Component
  @defaultProps: {
    margin: {
      left: 30
      top: 30
      right: 10
      bottom: 30
    }
    showFacies: false
    hideDefaultColumn: false
    columnImage: null
  }
  @propTypes: {
    inEditMode: T.bool.isRequired
    generalized: T.bool
    editingInterval: T.object
    surfaces: T.arrayOf(T.object).isRequired
    notes: T.arrayOf(T.object).isRequired
    editInterval: T.func.isRequired
    addInterval: T.func.isRequired
    height: T.number.isRequired
    hideDetailColumn: T.bool
    updateNote: T.func.isRequired
    columnImage: T.string
  }

  shouldShowNotes: =>
    not @props.editingInterval? and not @props.hideDetailColumn

  render: ->
    { margin, clickedHeight,
      showFacies, notes, inEditMode,
      generalized, editingInterval,
      height,
      addInterval, removeInterval,
      editInterval, onUpdate
      columnImage
    } = @props

    lithologyWidth = 40
    columnWidth = 212
    grainsizeScaleStart = 132
    notesWidth = 500
    notesMargin = 10
    editorMargin = 30
    notesOffset = columnWidth+notesMargin
    containerWidth = columnWidth

    if @props.hideDetailColumn
      editingInterval = null

    if @shouldShowNotes()
      containerWidth = notesOffset+notesWidth

    h ColumnProvider, {
      divisions: @props.surfaces,
      range: [0,height],
      pixelsPerMeter: 20
    }, [
      h 'div.column-container', [
        h GrainsizeLayoutProvider, {
          width: columnWidth,
          grainsizeScaleStart
        }, [
          h.if(not generalized and columnImage) ColumnImage, {
            left: @props.margin.left+lithologyWidth
            top: @props.margin.top
            src: columnImage
          }
          h.if(inEditMode) DivisionEditOverlay, {
            top: @props.margin.top
            left: @props.margin.left
            width: 200
            onClick: @props.editInterval
            editingInterval
          }
          h ColumnSVG, {
            width: containerWidth,
            margin,
            style: {zIndex: 10, position: 'relative'}
          }, [
            h MainColumn, {generalized, lithologyWidth}, [
              h.if(showFacies) FaciesColumnInner
              h CoveredOverlay
              h LithologyColumnInner
            ]
            h SymbolColumn, {left: 90}
            h ColumnAxis
            h GrainsizeAxis
            # Notes column
            h.if(@shouldShowNotes()) NotesColumn, {
              notes,
              transform: "translate(#{notesOffset})",
              width: notesWidth
              inEditMode
              onUpdateNote: @props.updateNote
            }
          ]
        ]
      ]
      h.if(@props.editingInterval) IntervalEditor, {
        interval: editingInterval
        height: clickedHeight
        closeDialog: =>
          editInterval(null)
        addInterval
        removeInterval
        setEditingInterval: editInterval
        onUpdate
      }
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
