import {Component, createElement} from "react"
import h from "react-hyperscript"
import Select from 'react-select'

import {FaciesCard, FaciesContext} from "../../facies"
import "react-select/dist/react-select.css"

class LithologyPicker extends Component
  @contextType: FaciesContext
  render: ->
    {facies} = @context
    {interval, onChange} = @props

    options = facies.map (f)->
      {value: f.id, label: h(FaciesCard, {facies: f})}

    value = options.find (d)->d.value == interval.facies
    value ?= null

    h Select, {
      id: 'lithology-select'
      options
      value
      selected: interval.facies
      onChange: (res)->
        f = if res? then res.value else null
        onChange f
    }

export {LithologyPicker}
