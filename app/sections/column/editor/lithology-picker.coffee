import {Component, createElement, useContext} from "react"
import h from "react-hyperscript"
import Select from 'react-select'

import {symbolIndex} from "app/sections/column/lithology"
import {PlatformContext} from "app/platform"
import {LithologyContext} from "app/sections/lithology"

import styles from './main.styl'

LithologySwatch = ({symbolID, style, rest...})->
  {resolveLithologySymbol} = useContext(PlatformContext)
  src = resolveLithologySymbol(symbolID)
  style ?= {}
  style.backgroundImage = "url(\"#{src}\")"
  h 'div', {className: styles.lithologySwatch, style, rest...}

LithologyItem = (props)->
  {symbol, lithology} = props
  h 'span', {className: styles.faciesPickerRow}, [
    h LithologySwatch, {symbolID: symbol}
    h 'span', {className: styles.faciesPickerName}, lithology
  ]

class LithologyPicker extends Component
  @contextType: LithologyContext
  render: ->
    {interval, onChange} = @props

    {lithology} = @context

    options = for item in lithology
      {id, pattern} = item
      symbol = symbolIndex[pattern]
      continue unless symbol?
      {value: id, label: h(LithologyItem, {lithology: id, symbol})}

    console.log options

    value = options.find (d)->d.value == interval.lithology
    value ?= null

    h Select, {
      id: 'lithology-select'
      options
      value
      selected: interval.lithology
      onChange: (res)->
        f = if res? then res.value else null
        onChange f
    }

class LithologySymbolPicker extends Component
  render: ->
    {interval} = @props
    h 'div'

export {LithologyPicker, LithologySymbolPicker}
