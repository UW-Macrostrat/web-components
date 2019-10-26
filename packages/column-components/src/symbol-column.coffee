import {select} from "d3-selection"
import {Component, createElement, useContext} from "react"
import h from "react-hyperscript"
import {join, resolve} from "path"
import classNames from "classnames"
import {path} from "d3-path"
import {ColumnContext, AssetPathContext} from './context'
import {UUIDComponent} from './frame'
import T from 'prop-types'

symbolIndex = {
  "Hummocky cross-stratified": "column-patterns/hcs.svg"
  "Trough cross-stratified": "column-patterns/tcs.svg"
  "Dessication cracks": "column-patterns/dessication-cracks.svg"
  "Ooids": "column-patterns/ooids.svg"
  "Domal stromatolites": "column-patterns/domal-stromatolites.svg"
  "Digitate stromatolites": "column-patterns/digitate-stromatolites.svg"
}

Symbol = (props)->
  {symbol, width, height, UUID} = props
  {resolveSymbol} = useContext(AssetPathContext)
  id = "#{UUID}-#{symbol}"
  symbolSize = {width}
  href = resolveSymbol(symbolIndex[symbol])

  h 'symbol', {
    id
    key: id
    symbolSize...
  }, [
    h 'image', {
      href
      x:0,y:0
      symbolSize...
    }
  ]

SymbolDefs = (props)->
  {patterns, rest...} = props
  ids = []
  h 'defs', patterns.map (sym)->
    {symbol} = sym
    return null if ids.includes(symbol)
    ids.push(symbol)
    h Symbol, {symbol, rest...}

class SymbolColumn extends UUIDComponent
  @contextType: ColumnContext
  @defaultProps: {
    width: 30
    left: 0
  }
  constructor: (props)->
    super props
    @state = {
      symbols: []
      patterns: []
    }

  #   query 'section-symbols', [@props.id]
  #     .then @setupData
  #
  # setupData: (symbols)=>
  #   patterns = symbols
  #     .filter((x, i, arr) => arr.indexOf(x) == i)
  #   @setState {symbols, patterns}

  render: ->
    {scale, height, zoom} = @context
    {left, width} = @props
    {symbols, patterns} = @state
    transform = null
    if left?
      transform = "translate(#{left})"

    symbols = symbols
      .filter (d)->d.symbol_min_zoom < zoom
      .map @renderSymbol

    x = 0
    y = 0
    h 'g.symbol-column', {transform}, [
      h SymbolDefs, {width, patterns, UUID: @UUID}
      h 'rect.symbol-column-area', {width, height}
      h 'g.symbols', symbols
    ]

  renderSymbol: (d)=>
    {scale} = @context
    {symbol, id, height} = d
    className = classNames({symbol}, 'symbol')

    {width} = @props
    y = scale(height)-width/2

    href = "##{@UUID}-#{symbol}"
    h "use", {className,y, x: 0, width, xlinkHref: href, key: id}

class SymbolLegend extends Component
  @contextType: AssetPathContext
  render: ->
    {resolveSymbol} = @context
    arr = []
    for name,symbol of symbolIndex
      sym =  h 'div', {key: name}, [
        h 'img', {src: resolveSymbol(symbol)}
        h 'span.label', name
      ]
      arr.push sym

    h 'div.symbol-legend', arr

export {SymbolColumn, SymbolLegend}
