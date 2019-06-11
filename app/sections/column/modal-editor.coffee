import {findDOMNode} from "react-dom"
import {Component, createElement} from "react"
import {Dialog, Button, Intent, ButtonGroup, Alert, Slider} from "@blueprintjs/core"
import {FaciesDescriptionSmall, FaciesContext} from "../facies"
import {PickerControl} from "../settings"
import Select from 'react-select'
import "react-select/dist/react-select.css"

import {grainSizes} from "./grainsize"
import h from "react-hyperscript"
import * as d3 from "d3"
import {db, storedProcedure, query} from "../db"
fmt = d3.format('.1f')

import {dirname} from "path"
baseDir = dirname require.resolve '..'
sql = (id)-> storedProcedure(id, {baseDir})
try
  {helpers} = require '../../db/backend'
catch
  {}

floodingSurfaceOrders = [-1,-2,-3,-4,-5,null,5,4,3,2,1]

surfaceTypes = [
  {value: 'mfs', label: 'MFS'}
  {value: 'sb', label: 'SB'}
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
    h FaciesContext.Consumer, null, ({surfaces})=>
      @renderMain(surfaces)

  surfaceOrderSlider: =>
    {interval} = @props
    if not interval.surface_type?
      return h 'p', 'Please set an interval type to access surface orders'
    val = interval.surface_order
    val ?= 5
    return h Slider, {
      min: 0
      max: 5
      stepSize: 1
      showTrackFill: false
      value: val
      onChange: (surface_order)=>
        return unless interval.surface_type?
        @update {surface_order}
    }

  renderMain: (surfaces)=>
    {interval, height, section} = @props
    return null unless interval?
    console.log interval
    {id, top, bottom, facies} = interval
    hgt = fmt(height)

    options = surfaces.map (d)->
      {value: d.id, label: d.note}

    h Dialog, {
      className: 'pt-minimal'
      title: "Section #{section}: #{bottom} - #{top} m"
      isOpen: @props.isOpen
      onClose: @props.closeDialog
      style: {top: '10%'}
    }, [
      h 'div', {className:"pt-dialog-body"}, [
        h 'h3', [
          "ID "
          h 'code', interval.id
        ]
        h FaciesDescriptionSmall, {
          options: {isEditable: true}
          onClick: @updateFacies
          selected: facies
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
           @surfaceOrderSlider()
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
          h Select, {
            id: "state-select"
            ref: (ref) => @select = ref
            options
            clearable: true
            searchable: true
            name: "selected-state"
            value: interval.surface
            onChange: (surface)=>
              if surface?
                surface = surface.value
              @update {surface}
          }
        ]
        h 'div', [
          h 'h5', "Interval"
          h 'div.pt-button-group.pt-vertical', [
            h Button, {
              onClick: =>
                return unless @props.addInterval?
                @props.addInterval(height)
            }, "Add interval starting at #{fmt(height)} m"
            h Button, {
              onClick: =>
                @setState {isAlertOpen: true}
              intent: Intent.DANGER}, "Remove interval starting at #{bottom} m"
            h Alert, {
                iconName: "trash"
                intent: Intent.PRIMARY
                isOpen: @state.isAlertOpen
                confirmButtonText: "Delete interval"
                cancelButtonText: "Cancel"
                onConfirm: =>
                  @setState {isAlertOpen: false}
                  return unless @props.removeInterval?
                  @props.removeInterval(id)
                onCancel: => @setState {isAlertOpen: false}
            }, [
              h 'p', "Are you sure you want to delete the interval
                      beginning at #{hgt} m?"
            ]
          ]
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
    h FaciesContext.Consumer, null, ({surfaces})=>
      @renderMain(surfaces)

  renderMain: (surfaces)=>
    {interval, height, section} = @props
    return null unless interval?
    {id, top, bottom, facies} = interval
    hgt = fmt(height)

    options = surfaces.map (d)->
      {value: d.id, label: d.note}

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
         @surfaceOrderSlider()
      ]
      h 'label.pt-label', [
        'Correlated surface'
        h Select, {
          id: "state-select"
          ref: (ref) => @select = ref
          options
          clearable: true
          searchable: true
          name: "selected-state"
          value: interval.surface
          onChange: (surface)=>
            if surface?
              surface = surface.value
            @update {surface}
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
