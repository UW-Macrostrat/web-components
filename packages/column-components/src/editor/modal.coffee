import {findDOMNode} from "react-dom"
import {Component, createElement} from "react"
import {Dialog, Button, Intent, ButtonGroup, Alert, Slider} from "@blueprintjs/core"
import {DeleteButton} from '@macrostrat/ui-components'
import Select from 'react-select'
import {format} from "d3-format"

import {FaciesDescriptionSmall, FaciesCard} from "./facies"
import {FaciesContext, ColumnContext} from "../context"
import {PickerControl} from "./picker-base"
#import "react-select/dist/react-select.css"

import {LithologyPicker, LithologySymbolPicker, FillPatternControl} from './lithology-picker'
import {
  CorrelatedSurfaceControl,
  SurfaceOrderSlider,
  HorizontalPicker,
  BoundaryStyleControl
} from './controls'
import {FaciesPicker} from './facies/picker'
import {grainSizes} from "../grainsize"
import {IntervalShape} from './types'
import styles from "./main.styl"
import h from "react-hyperscript"
import T from 'prop-types'
import {dirname} from "path"

#import {db, storedProcedure, query} from "app/sections/db"

fmt = format('.1f')

# baseDir = dirname require.resolve '..'
# sql = (id)-> storedProcedure(id, {baseDir})
# try
#   {helpers} = require 'app/db/backend'
# catch
#   {}

floodingSurfaceOrders = [-1,-2,-3,-4,-5,null,5,4,3,2,1]

surfaceTypes = [
  {value: 'mfs', label: 'Maximum flooding surface'}
  {value: 'sb', label: 'Sequence boundary'}
]

class ModalEditor extends Component
  @defaultProps: {onUpdate: ->}
  constructor: (props)->
    super props
    @state = {
      facies: [],
      isAlertOpen: false
    }
  render: ->
    {interval, height, section} = @props
    return null unless interval?
    {id, top, bottom, facies} = interval
    hgt = fmt(height)
    txt = "interval starting at #{hgt} m"

    h Dialog, {
      className: "bp3-minimal"
      title: h "div", {className: styles.editorDialogTitle}, [
        h "span", {className: styles.titleCenter}, "Section #{section}"
        h "span", {className: styles.heightRange}, "#{bottom} - #{top} m"
        h "code", interval.id
      ]
      isOpen: @props.isOpen
      onClose: @props.closeDialog
      style: {top: '10%', zIndex: 1000, position: 'relative'}
    }, [
      h 'div', {className:"bp3-dialog-body"}, [
        h 'label.bp3-label', [
          'Lithology'
          h LithologyPicker, {
            interval
            onChange: (lithology)=>@update {lithology}
          }
        ]
        h 'label.bp3-label', [
          'Lithology symbol'
          h LithologySymbolPicker, {
            interval
            onChange: (d)=>@update {fillPattern: d}
          }
        ]
        h 'label.bp3-label', [
          'Grainsize'
          h PickerControl, {
            vertical: false,
            isNullable: true,
            states: grainSizes.map (d)->
              {label: d, value: d}
            activeState: interval.grainsize
            onUpdate: (grainsize)=>
              @update {grainsize}
          }
        ]
        h 'label.bp3-label', [
          'Surface expression'
          h BoundaryStyleControl, {
            interval
            onUpdate: (d)=>@update {definite_boundary: d}
          }
        ]
        h 'label.bp3-label', [
          'Facies'
          h FaciesPicker, {
            onClick: @updateFacies
            interval
            onChange: (facies)=>@update {facies}
          }
        ]
        h 'label.bp3-label', [
          'Surface type (parasequence)'
          h PickerControl, {
            vertical: false,
            isNullable: true,
            states: surfaceTypes
            activeState: interval.surface_type
            onUpdate: (surface_type)=>
              @update {surface_type}
          }
        ]
        h 'label.bp3-label', [
          'Surface order'
          h SurfaceOrderSlider, {
            interval, onChange: @update
          }
        ]
        h 'label.bp3-label', [
          'Flooding surface (negative is regression)'
          h PickerControl, {
            vertical: false,
            isNullable: true,
            states: floodingSurfaceOrders.map (d)->
              lbl = "#{d}"
              lbl = 'None' if not d?
              {label: d, value: d}
            activeState: interval.flooding_surface_order
            onUpdate: (flooding_surface_order)=>
              @update {flooding_surface_order}
          }
        ]
        h 'label.bp3-label', [
          'Correlated surface'
          h CorrelatedSurfaceControl, {
            interval
            onChange: @update
          }
        ]
        h 'div.buttons', [
          h DeleteButton, {
            itemDescription: "the "+txt
            handleDelete: =>
              return unless @props.removeInterval?
              @props.removeInterval(id)
          }, "Delete this interval"
          h Button, {
            onClick: =>
              return unless @props.addInterval?
              @props.addInterval(height)
          }, "Add interval starting at #{fmt(height)} m"
        ]
      ]
    ]
  updateFacies: (facies)=>
    {interval} = @props
    selected = facies.id
    if selected == interval.facies
      selected = null
    @update {facies: selected}

  update: (columns)=>
    {TableName, update} = helpers
    tbl = new TableName("section_lithology", "section")
    id = @props.interval.id
    section = @props.section
    s = helpers.update columns, null, tbl
    s += " WHERE id=#{id} AND section='#{section}'"
    await db.none(s)
    @props.onUpdate()

class IntervalEditor extends ModalEditor
  @defaultProps: {
    onUpdate: ->
    onNext: ->
    onPrev: ->
    onClose: ->
  }

  render: ->
    {interval, height, section} = @props
    return null unless interval?
    {id, top, bottom, facies} = interval
    hgt = fmt(height)

    width = @props.width or 240
    h 'div.interval-editor', {style: {padding: 20, zIndex: 50, backgroundColor: 'white', width}}, [
      h 'h3', [
        "Interval "
        h 'code', interval.id
      ]
      h 'h6', "#{fmt(interval.bottom)}-#{fmt(interval.top)} m"
      h 'label.bp3-label', [
        'Surface type'
        h PickerControl, {
          vertical: false,
          isNullable: true,
          states: surfaceTypes
          activeState: interval.surface_type
          onUpdate: (surface_type)=>
            @update {surface_type}
        }
      ]
      h 'label.bp3-label', [
        'Surface order'
        h SurfaceOrderSlider, {
          interval, onChange: @update
        }
      ]
      h 'label.bp3-label', [
        'Correlated surface'
        h CorrelatedSurfaceControl, {
          interval
          onChange: @update
        }
      ]
      #h ButtonGroup, [
        #h Button, {onClick: @props.onPrev}, "Previous"
        #h Button, {onClick: @props.onNext}, "Next"
      #]
      #h Button, {intent: Intent.PRIMARY, onClick: @props.onClose}, "Close"
    ]
  updateFacies: (facies)=>
    {interval} = @props
    selected = facies.id
    if selected == interval.facies
      selected = null
    @update {facies: selected}

  update: (columns)=>
    {TableName, update} = helpers
    tbl = new TableName("section_lithology", "section")
    id = @props.interval.id
    section = @props.section
    s = helpers.update columns, null, tbl
    s += " WHERE id=#{id} AND section='#{section}'"
    console.log s
    await db.none(s)
    @props.onUpdate()


export {ModalEditor, IntervalEditor}
