import {Component} from 'react'
import h from 'react-hyperscript'
import {FaciesContext, BasicFaciesSwatch} from '../../facies'
import Select from 'react-select'
import styles from './main.styl'

FaciesRow = ({facies})->
  h 'span', {className: styles.faciesPickerRow}, [
    h BasicFaciesSwatch, {facies, className: styles.faciesColorSwatch}
    h 'span', {className: styles.faciesPickerName}, facies.name
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

    h Select, {
      id: 'facies-select'
      options
      value
      selected: interval.facies
      onChange: (res)->
        f = if res? then res.value else null
        onChange f
    }

export {FaciesPicker}
