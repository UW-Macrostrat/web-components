{query} = require '../db'
{select} = require 'd3-selection'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
{join} = require 'path'
{v4} = require 'uuid'
classNames = require 'classnames'
{createGrainsizeScale} = require './grainsize'
{path} = require 'd3-path'

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
    UUID = v4()
    @state = {
      UUID
      frameID: "#frame-#{UUID}"
      clipID: "#clip-#{UUID}"
      divisions: []
      patterns: []
    }

    query 'lithology', [@props.id]
      .then @setupData

  resolveID: (d)->
    if d.fgdc_pattern?
      return "#{d.fgdc_pattern}"
    return "#{symbolIndex[d.pattern]}"

  setupData: (divisions)=>
    divisions.reverse()
    patterns = divisions
      .map(@resolveID)
      .filter((x, i, arr) => arr.indexOf(x) == i)
    @setState {divisions, patterns}

  createFrame: ->
    {width, height} = @props
    {frameID} = @state
    h "rect#{frameID}", {x:0,y:0,width,height, key: frameID}

  render: ->
    {scale, visible,left} = @props
    {divisions, clipID, frameID} = @state
    divisions = [] unless visible
    {width, height} = @props
    transform = null
    if left?
      transform = "translate(#{left})"

    clipPath = "url(#{clipID})"
    h 'g.lithology-column', {transform},[
      @createDefs()
      h 'g.lithology-inner', {clipPath}, [
        divisions.map(@renderDivision)...
        divisions.map(@renderCoveredOverlay)...
      ]
      h 'use.frame', {href: frameID, fill:'transparent'}
    ]

  createDefs: =>
    patternSize = {width: 100, height: 100}
    {patterns, UUID, frameID, clipID} = @state
    elements = patterns.map (d)=>
      id = "#{UUID}-#{d}"
      h 'pattern', {
        id
        key: id
        patternUnits: "userSpaceOnUse"
        patternSize...
      }, [
        h 'image', {
          href: resolveSymbol(d)
          x:0,y:0
          patternSize...
        }
      ]

    clipPath = createElement(
      "clipPath",
      {id: clipID.slice(1), key: clipID}, [
        h 'use', {'href': frameID}
      ])
    h 'defs', [
      @createFrame()
      clipPath
      elements...
    ]

  renderDivision: (d)=>
    className = classNames({
      definite: d.definite_boundary
      covered: d.covered}, 'lithology')

    {width,scale} = @props
    {UUID} = @state
    [bottom,top] = __divisionSize(d)
    y = scale(top)
    height = scale(bottom)-y+1

    fn = resolveSymbol d

    __ = @resolveID(d)
    fill = "url(##{UUID}-#{__})"
    h "rect", {className,y, x: -5, width: width+10, height, fill, key: d.id}

  renderCoveredOverlay: (d)=>
    return null if not d.covered
    {width,scale} = @props
    [bottom,top] = __divisionSize(d)
    y = scale(top)
    height = scale(bottom)-y+1
    h "rect.covered-area", {y, width, height, key: "#{bottom}-covered"}

class CoveredColumn extends LithologyColumn
  @defaultProps: {
    width: 5
  }
  constructor: (props)->
    super props
  render: ->
    {scale, left} = @props
    {divisions} = @state
    {width, height} = @props
    transform = null
    left ?= -width
    if left?
      transform = "translate(#{left})"

    h 'g.lithology-column.covered-column', {transform},[
      h 'g.lithology-inner', [
        divisions.map(@renderCoveredOverlay)...
      ]
    ]



class GeneralizedSectionColumn extends LithologyColumn
  constructor: (props)->
    super props
  componentWillUpdate: (props)->
    {width, grainsizeScaleStart} = props
    grainsizeScaleStart ?= width/4
    @grainsizeScale = createGrainsizeScale([grainsizeScaleStart, width])
  renderCoveredOverlay: ->
    return null
  resolveID: (d)->
    p = symbolIndex[d.fill_pattern]
    return p if p?
    fp = d.fill_pattern
    # Special case for shales since we probably want to emphasize lithology
    if parseInt(fp) == 624
      return super.resolveID(d)
    else
      return fp

  createFrame: ->
    {scale} = @props
    {divisions,frameID} = @state
    if divisions.length == 0
      return super.createFrame()

    topOf = (d)->
      scale(d.top)
    bottomOf = (d)->
      scale(d.bottom)

    _ = path()
    _.moveTo(0,topOf(divisions[0]))
    for div in divisions
      x = @grainsizeScale(div.grainsize)
      _.lineTo x, topOf(div)
      _.lineTo x, bottomOf(div)
    _.lineTo 0, bottomOf(div)
    _.closePath()
    h "path#{frameID}", {d: _.toString()}

module.exports = {LithologyColumn, GeneralizedSectionColumn, CoveredColumn}
