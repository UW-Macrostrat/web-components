import {Component, createElement, useContext} from "react"
import h from "react-hyperscript"
import Select from 'react-select'

import {symbolIndex} from "app/sections/column/lithology"
import {PlatformContext} from "app/platform"

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

options = for k,v of symbolIndex
  {value: k, label: h(LithologyItem, {lithology: k, symbol: v})}

class LithologyPicker extends Component
  render: ->
    {interval, onChange} = @props

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

export {LithologyPicker}
