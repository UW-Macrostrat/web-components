import {findDOMNode} from "react-dom"
import {Component, createElement} from "react"
import {Dialog, Button, Intent, ButtonGroup, Alert, Slider} from "@blueprintjs/core"
import {DeleteButton} from '@macrostrat/ui-components'
import {format} from "d3-format"

import {FaciesDescriptionSmall, FaciesCard} from "./facies"
import {PickerControl} from "./picker-base"
import {FaciesContext, ColumnContext} from "../context"

import {LithologyPicker, LithologySymbolPicker, FillPatternControl} from './lithology-picker'
import {FaciesPicker} from './facies/picker'
import {grainSizes} from "../grainsize"
import {RaisedSelect} from './util'
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
  #if not interval.surface_type?
  #  return h 'p', 'Please set an surface type to access orders'
  val = interval.surface_order
  val ?= 5
  h Slider, {
    min: 0
    max: 5
    disabled: not interval.surface_type?
    stepSize: 1
    showTrackFill: false
    value: val
    onChange: (surface_order)=>
      return unless interval.surface_type?
      onChange {surface_order}
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

export {
  SurfaceOrderSlider,
  BoundaryStyleControl,
  HorizontalPicker,
  RaisedSelect
}
