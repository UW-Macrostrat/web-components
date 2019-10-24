import {findDOMNode} from "react-dom"
import {Component, createElement} from "react"
import {Dialog, Button, Intent, ButtonGroup, Alert, Slider} from "@blueprintjs/core"
import {DeleteButton} from '@macrostrat/ui-components'
import Select from 'react-select'
import {format} from "d3-format"
import T from 'prop-types'

import {FaciesContext, ColumnContext} from "@macrostrat/column-components"

import {FaciesDescriptionSmall, FaciesCard} from "@macrostrat/column-components/src/editor/facies"
import {PickerControl} from "@macrostrat/column-components/src/editor/picker-base"
import {
  LithologyPicker,
  LithologySymbolPicker,
  FillPatternControl
} from '@macrostrat/column-components/src/editor/lithology-picker'
import {
  SurfaceOrderSlider,
  HorizontalPicker,
  BoundaryStyleControl
} from '@macrostrat/column-components/src/editor/controls'

import {FaciesPicker} from '@macrostrat/column-components/src/editor/facies/picker'
import {grainSizes} from "@macrostrat/column-components/src/grainsize"
import {IntervalShape} from '@macrostrat/column-components/src/editor/types'
import {Panel} from '~/src/ui'
import h from "~/hyper"

fmt = format('.1f')

surfaceTypes = [
  {value: 'mfs', label: 'Maximum flooding surface'}
  {value: 'sb', label: 'Sequence boundary'}
]

class IntervalEditor extends Component
  @defaultProps: {onUpdate: ->}
  @propTypes: {
    setEditingInterval: T.func.isRequired
    onUpdate: T.func.isRequired
  }
  @contextType: ColumnContext
  constructor: (props)->
    super props
    @state = {
      facies: [],
      isAlertOpen: false
    }
  render: ->
    {interval, height, section, style} = @props
    {divisions} = @context
    return null unless interval?
    ix = divisions.indexOf(interval)

    {id, top, bottom, facies} = interval
    hgt = fmt(height)
    txt = "interval starting at #{hgt} m"
    h Panel, {
      style
      className: 'interval-editor'
      title: h [
        "Edit interval "
        h "span.height-range", "#{bottom} - #{top} m"
      ]
      onClose: =>
        @props.setEditingInterval(null)
    }, [
      h 'div.buttons', [
        h Button, {
          onClick: =>
            division = divisions[ix-1]
            @props.setEditingInterval {division}
          disabled: ix == 0
        }, 'Previous'
        h Button, {
          onClick: =>
            division = divisions[ix+1]
            @props.setEditingInterval {division}
          disabled: ix == divisions.length-1
        }, 'Next'
      ]
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

  updateFacies: (facies)=>
    {interval} = @props
    selected = facies.id
    if selected == interval.facies
      selected = null
    @update {facies: selected}

  update: (newData)=>
    {interval} = @props
    @props.onUpdate(interval, newData)

WrappedIntervalEditor = (props)->
  h 'div.editor-column', [
    h IntervalEditor, props
  ]

export {WrappedIntervalEditor as IntervalEditor}
