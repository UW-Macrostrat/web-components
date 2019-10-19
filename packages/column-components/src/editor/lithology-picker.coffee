import {Component, createElement, useContext} from "react"
import hyper from "@macrostrat/hyper"
import Select from 'react-select'

import {symbolIndex} from "../lithology"
import {AssetPathContext, LithologyContext} from "../context"

import styles from './main.styl'

h = hyper.styled(styles)

LithologySwatch = ({symbolID, style, rest...})->
  {resolveLithologySymbol} = useContext(AssetPathContext)
  src = resolveLithologySymbol(symbolID)
  style ?= {}
  style.backgroundImage = "url(\"#{src}\")"
  h 'div.lithology-swatch', {style, rest...}

LithologyItem = (props)->
  {symbol, lithology} = props
  h 'span.facies-picker-row', [
    h LithologySwatch, {symbolID: symbol}
    h 'span.facies-picker-name', lithology
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
    isUserSet = false
    console.log interval
    text = "No pattern set"
    if interval.pattern?
      symbol = interval.pattern
      isUserSet = true
      text = "Symbol #{symbol}"
    if interval.lithology?
      symbol = symbolIndex[interval.lithology]
      text = "Default for lithology"

    h 'div.lithology-symbol-picker', [
      h.if(symbol?) LithologySwatch, {symbolID: symbol}
      h "div.picker-label.text", text
    ]

export {LithologyPicker, LithologySymbolPicker}
