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
  constructor: (props)->
    super props
    @state =
      patternUUID: v4()
      divisions: []
      patterns: []
    query 'lithology', [@props.id]
      .then @setupData

  setupData: (divisions)=>
    divisions.reverse()
    patterns = divisions
      .map(resolveID)
      .filter((x, i, a) => a.indexOf(x) == i)
    @setState {divisions, patterns}

  render: ->
    {scale, visible} = @props
    {divisions} = @state
    divisions = [] unless visible
    {width, height} = @props
    h 'g.lithology-column', [
      @createDefs()
      divisions.map(@renderDivision)...
      divisions.map(@renderCoveredOverlay)...
      h 'rect.frame', {x:0,y:0,width,height,fill:'transparent'}
    ]

  createDefs: ->
    width = 100
    height = 100
    {patternUUID,patterns} = @state
    elements = patterns.map (d)->
      h 'pattern', {
        id: "#{patternUUID}-#{d}"
        patternUnits: "userSpaceOnUse"
        width,
        height
      }, [
        h 'image', {
          href: resolveSymbol(d)
          x:0,y:0, width, height
        }
      ]

    h 'defs', elements

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
    fill = "url(##{patternUUID}-#{__})"
    h "rect", {className,y, width, height, fill}

  renderCoveredOverlay: (d)=>
    return null if not d.covered
    {width,scale} = @props
    [bottom,top] = __divisionSize(d)
    y = scale(top)
    height = scale(bottom)-y+1
    h "rect.covered-area", {y, width, height}

module.exports = LithologyColumn
