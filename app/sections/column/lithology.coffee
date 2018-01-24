{query} = require '../db'
{select} = require 'd3-selection'
{Component} = require 'react'
h = require 'react-hyperscript'
{join} = require 'path'
{v4} = require 'uuid'
classNames = require 'classnames'

symbolIndex =
  'dolomite-limestone': 641
  'lime_mudstone': 627
  'sandstone': 607
  'siltstone': 616
  'shale': 620
  'limestone': 627
  'dolomite': 642
  'conglomerate': 602
  'dolomite-mudstone': 642
  'mudstone': 620
  'sandy-dolomite': 645

resolveID = (d)->
  if d.fgdc_pattern?
    return d.fgdc_pattern
  return symbolIndex[d.pattern]

resolveSymbol = (id)->
  try
    if PLATFORM == ELECTRON
      q = require.resolve "geologic-patterns/assets/png/#{id}.png"
      return 'file://'+q
    else
      return join BASE_URL, 'assets',"#{id}.png"
  catch
    return ''

__divisionSize = (d)->
  {bottom,top} = d
  if top < bottom
    [top,bottom] = [bottom,top]
  return [bottom, top]

class LithologyColumn extends Component
  @defaultProps:
    width: 100
    height: 100
    visible: true
    left: 0
  constructor: (props)->
    super props
    @UUID = v4()
    @frameID = "#frame-#{@UUID}"
    @clipID = "#clip-#{@UUID}"

    @state = {
      divisions: []
      patterns: []
    }

    query 'lithology', [@props.id]
      .then @setupData

  setupData: (divisions)=>
    divisions.reverse()
    patterns = divisions
      .map(resolveID)
      .filter((x, i, a) => a.indexOf(x) == i)
    @setState {divisions, patterns}

  render: ->
    {scale, visible,left} = @props
    {divisions} = @state
    divisions = [] unless visible
    {width, height} = @props
    transform = null
    if left?
      transform = "translate(#{left})"

    clipPath = "url(#{@clipID})"
    h 'g.lithology-column', {transform},[
      @createDefs()
      h 'g.lithology-inner', {clipPath}, [
        divisions.map(@renderDivision)...
        divisions.map(@renderCoveredOverlay)...
      ]
      h 'use.frame', {href: @frameID,fill:'transparent'}
    ]

  createDefs: =>
    patternSize = {width: 100, height: 100}
    {patterns} = @state
    elements = patterns.map (d)=>
      h 'pattern', {
        id: "#{@UUID}-#{d}"
        patternUnits: "userSpaceOnUse"
        patternSize...
      }, [
        h 'image', {
          href: resolveSymbol(d)
          x:0,y:0
          patternSize...
        }
      ]

    {width, height} = @props
    frame = h "rect#{@frameID}", {x:0,y:0,width,height}
    clipPath = h "clipPath#{@clipID}", [
      h 'use', {'href': @frameID}
    ]

    h 'defs', [frame,clipPath,elements...]

  renderDivision: (d)=>
    className = classNames({
      definite: d.definite_boundary
      covered: d.covered}, 'lithology')

    {width,scale} = @props
    {patternUUID} = @state
    [bottom,top] = __divisionSize(d)
    y = scale(top)
    height = scale(bottom)-y+1

    fn = resolveSymbol d

    __ = resolveID(d)
    fill = "url(##{@UUID}-#{__})"
    h "rect", {className,y, width, height, fill}

  renderCoveredOverlay: (d)=>
    return null if not d.covered
    {width,scale} = @props
    [bottom,top] = __divisionSize(d)
    y = scale(top)
    height = scale(bottom)-y+1
    h "rect.covered-area", {y, width, height}

class GeneralizedSectionColumn extends LithologyColumn

module.exports = {LithologyColumn, GeneralizedSectionColumn}
