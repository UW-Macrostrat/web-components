import {findDOMNode} from "react-dom"
import {Component, createElement} from "react"
import {Dialog, Button, Intent, ButtonGroup, Alert, Slider} from "@blueprintjs/core"
import {DeleteButton} from '@macrostrat/ui-components'
import Select from 'react-select'
import {format} from "d3-format"

import {FaciesDescriptionSmall, FaciesCard} from "./facies"
import {PickerControl} from "./picker-base"
import {FaciesContext, ColumnContext} from "../context"

import {LithologyPicker, LithologySymbolPicker, FillPatternControl} from './lithology-picker'
import {FaciesPicker} from './facies/picker'
import {grainSizes} from "../grainsize"
import h from "react-hyperscript"
import styles from "./main.styl"
import T from 'prop-types'
import {IntervalShape} from './types'

fmt = format('.1f')

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

HorizontalPicker = (props)->
  h PickerControl, {
    vertical: false,
    isNullable: true
    props...
  }

class BoundaryStyleControl extends Component
  @propTypes: {
    interval: IntervalShape
  }
  render: ->
    {interval, onUpdate} = @props
    states = [
        {label: "Abrupt", value: true}
        {label: "Diffuse", value: false}
      ]

    h HorizontalPicker, {
      states
      activeState: interval.definite_boundary
      onUpdate
    }

export {SurfaceOrderSlider, BoundaryStyleControl, HorizontalPicker, CorrelatedSurfaceControl}
