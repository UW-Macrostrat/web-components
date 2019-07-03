import {findDOMNode} from "react-dom"
import {Component, createElement} from "react"
import {Dialog, Button, Intent, ButtonGroup, Alert, Slider} from "@blueprintjs/core"
import {DeleteButton} from '@macrostrat/ui-components'
import {FaciesDescriptionSmall, FaciesContext, FaciesCard} from "../facies"
import {PickerControl} from "../settings"
import {ColumnContext} from "./context"
import Select from 'react-select'
import "react-select/dist/react-select.css"

import {grainSizes} from "./grainsize"
import h from "react-hyperscript"
import {format} from "d3-format"
import {db, storedProcedure, query} from "../db"
fmt = format('.1f')

import {dirname} from "path"
baseDir = dirname require.resolve '..'
sql = (id)-> storedProcedure(id, {baseDir})
try
  {helpers} = require '../../db/backend'
catch
  {}

floodingSurfaceOrders = [-1,-2,-3,-4,-5,null,5,4,3,2,1]

surfaceTypes = [
  {value: 'mfs', label: 'Maximum flooding surface'}
  {value: 'sb', label: 'Sequence boundary'}
]

SurfaceOrderSlider = (props)->
  {interval, onChange} = props
  if not interval.surface_type?
    return h 'p', 'Please set an interval type to access surface orders'
  val = interval.surface_order
  val ?= 5
  h Slider, {
    min: 0
    max: 5
    stepSize: 1
    showTrackFill: false
    value: val
    onChange: (surface_order)=>
      return unless interval.surface_type?
      onChange {surface_order}
  }

class CorrelatedSurfaceControl extends Component
  @contextType: FaciesContext
  render: ->
    {surfaces} = @context
    {onChange, interval} = @props

    options = surfaces.map (d)->
      {value: d.id, label: d.note}

    h Select, {
      id: "state-select"
      options
      clearable: true
      searchable: true
      name: "selected-state"
      value: interval.surface
      onChange: (surface)=>
        if surface?
          surface = surface.value
        onChange {surface}
    }

class FaciesPicker extends Component
  @contextType: FaciesContext
  render: ->
    {facies} = @context
    {interval, onChange} = @props

    options = facies.map (f)->
      {value: f.id, label: h(FaciesCard, {facies: f})}

    console.log interval.facies
    value = options.find (d)->d.value == interval.facies
    value ?= null
    console.log value

    h Select, {
      id: 'facies-select'
      options
      value
      selected: interval.facies
      onChange: (res)->
        console.log res
        if res?
          f = res.value
        else
          f = null
        console.log f
        onChange f
    }

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
    console.log interval
    {id, top, bottom, facies} = interval
    hgt = fmt(height)
    txt = "interval starting at #{hgt} m"

    h Dialog, {
      className: 'pt-minimal'
      title: [
        h "code", {style: {transform: "translateY(-2px)", display: "inline-block"}}, interval.id
        " Section #{section}: #{bottom} - #{top} m"
      ]
      isOpen: @props.isOpen
      onClose: @props.closeDialog
      style: {top: '10%', zIndex: 1000, position: 'relative'}
    }, [
      h 'div', {className:"pt-dialog-body"}, [
        h FaciesPicker, {
          onClick: @updateFacies
          interval
          onChange: (facies)=>@update {facies}
        }
        h 'label.pt-label', [
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
        h 'label.pt-label', [
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
        h 'label.pt-label', [
          'Surface order'
          h SurfaceOrderSlider, {
            interval, onChange: @update
          }
        ]
        h 'label.pt-label', [
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
        h 'label.pt-label', [
          'Correlated surface'
          h CorrelatedSurfaceControl, {
            interval
            onChange: @update
          }
        ]
        h 'div.pt-button-group', [
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
      h 'label.pt-label', [
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
      h 'label.pt-label', [
        'Surface order'
        h SurfaceOrderSlider, {
          interval, onChange: @update
        }
      ]
      h 'label.pt-label', [
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
