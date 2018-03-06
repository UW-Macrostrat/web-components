{query} = require '../db'
{select} = require 'd3-selection'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
{join, resolve} = require 'path'
{v4} = require 'uuid'
classNames = require 'classnames'
{path} = require 'd3-path'

symbolIndex = {
  "Cross-beds": "sedlog-patterns/symbols/herringbone.svg"
  "Gutter cast": "sedlog-patterns/symbols/scours.svg"
  "Hummocky cross-stratified": "sedlog-patterns/symbols/hummocky.svg"
  "Mudcracks": "sedlog-patterns/symbols/mudcracks.svg"
  "Stromatolites": "sedlog-patterns/symbols/stromatolites.svg"
  "Trough cross-stratified": "sedlog-patterns/symbols/troughs.svg"
  "Wavy": "sedlog-patterns/symbols/wave-ripple.svg"
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

class SymbolColumn extends Component
  @defaultProps:
    width: 30
    height: 100
    visible: true
    left: 0
  constructor: (props)->
    super props
    @UUID = v4()
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
    {scale, visible,left, width, height} = @props
    {symbols, patterns} = @state
    transform = null
    if left?
      transform = "translate(#{left})"

    x = 0
    y = 0
    h 'g.symbol-column', {transform}, [
      @createDefs()
      h 'rect.symbol-column-area', {width, height}
      h 'g.symbols', symbols.map @renderSymbol
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
    {symbol, id, height} = d
    className = classNames({symbol}, 'symbol')

    {width,scale} = @props
    y = scale(height)-width/2+12

    href = "##{@UUID}-#{symbol}"
    h "use", {className,y, x: 0, width, href, key: id}

module.exports = {SymbolColumn}
