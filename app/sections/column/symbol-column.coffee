import {query} from "../db"
import {select} from "d3-selection"
import {Component, createElement} from "react"
import h from "react-hyperscript"
import {join, resolve} from "path"
import classNames from "classnames"
import {path} from "d3-path"
import {ColumnContext} from './context'
import {UUIDComponent} from './frame'

symbolIndex = {
  "Hummocky cross-stratified": "column-patterns/hcs.svg"
  "Trough cross-stratified": "column-patterns/tcs.svg"
  "Dessication cracks": "column-patterns/dessication-cracks.svg"
  "Ooids": "column-patterns/ooids.svg"
  "Domal stromatolites": "column-patterns/domal-stromatolites.svg"
  "Digitate stromatolites": "column-patterns/digitate-stromatolites.svg"
}

resolveSymbol = (sym)->
  try
    if PLATFORM == ELECTRON
      q = resolve join(BASE_DIR, 'assets', sym)
      return 'file://'+q
    else
      return join BASE_URL, 'assets', sym
  catch
    return ''

__divisionSize = (d)->
  {bottom,top} = d
  if top < bottom
    [top,bottom] = [bottom,top]
  return [bottom, top]

class SymbolColumn extends UUIDComponent
  @contextType: ColumnContext
  @defaultProps: {
    width: 30
    height: 100
    visible: true
    left: 0
    zoom: 1
  }
  constructor: (props)->
    super props
    @state = {
      symbols: []
      patterns: []
    }

    query 'section-symbols', [@props.id]
      .then @setupData

  setupData: (symbols)=>
    patterns = symbols
      .filter((x, i, arr) => arr.indexOf(x) == i)
    @setState {symbols, patterns}

  render: ->
    {scale, height, zoom} = @context
    {visible,left, width} = @props
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
      @createDefs()
      h 'rect.symbol-column-area', {width, height}
      h 'g.symbols', symbols
    ]

  createDefs: =>
    {width} = @props
    height = width
    symbolSize = {width}
    {patterns} = @state
    ids = []
    elements = for sym in patterns
      {symbol} = sym
      id = "#{@UUID}-#{symbol}"
      continue if ids.includes id
      href = resolveSymbol(symbolIndex[symbol])
      ids.push(id)
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

    h 'defs', elements

  renderSymbol: (d)=>
    {scale} = @context
    {symbol, id, height} = d
    className = classNames({symbol}, 'symbol')

    {width} = @props
    y = scale(height)-width/2

    href = "##{@UUID}-#{symbol}"
    h "use", {className,y, x: 0, width, xlinkHref: href, key: id}

class SymbolLegend extends Component
  render: ->
    arr = []
    for name,symbol of symbolIndex
      sym =  h 'div', {key: name}, [
        h 'img', {src: resolveSymbol(symbol)}
        h 'span.label', name
      ]

      arr.push sym

    h 'div.symbol-legend', arr

export {SymbolColumn, SymbolLegend}
