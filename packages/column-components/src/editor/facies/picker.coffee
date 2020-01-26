import {Component} from 'react'
import {hyperStyled} from '@macrostrat/hyper'
import {FaciesContext} from '../../context'
import {BasicFaciesSwatch} from './color-picker'
import {RaisedSelect} from '../util'
import styles from '../main.styl'

h = hyperStyled(styles)

FaciesRow = ({facies})->
  h 'span.facies-picker-row', [
    h BasicFaciesSwatch, {facies, className: 'facies-color-swatch'}
    h 'span.facies-picker-name', facies.name
  ]

class FaciesPicker extends Component
  @contextType: FaciesContext
  render: ->
    {facies} = @context
    {interval, onChange} = @props

    options = facies.map (f)->
      {value: f.id, label: h(FaciesRow, {facies: f})}

    value = options.find (d)->d.value == interval.facies
    value ?= null


    h RaisedSelect, {
      id: 'facies-select'
      options
      value
      selected: interval.facies
      isClearable: true
      onChange: (res)->
        console.log("Changing", res)
        f = if res? then res.value else null
        onChange f
    }

export {FaciesPicker}
