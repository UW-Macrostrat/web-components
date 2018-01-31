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
    showFacies: false
    padWidth: true
  queryID: 'lithology'
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

    query @queryID, [@props.id]
      .then @setupData

  resolveID: (d)->
    if d.fgdc_pattern?
      return "#{d.fgdc_pattern}"
    return "#{symbolIndex[d.pattern]}"

  setupData: (divisions)=>
    for d in divisions
      d.patternID = @resolveID(d)
    patterns = divisions
      .map (d)->d.patternID
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

    __ = [{divisions[0]...}]
    for d in divisions
      ix = __.length-1
      shouldSkip = not d.patternID? or d.patternID == __[ix].patternID
      if shouldSkip
        __[ix].top = d.top
      else
        __.push {d...}

    facies = null
    if @props.showFacies
      facies = @renderFacies()


    clipPath = "url(#{clipID})"
    h 'g.lithology-column', {transform},[
      @createDefs()
      h 'g.lithology-inner', {clipPath}, [
        facies
        h 'g.lithology', {}, __.map(@renderDivision)
        h 'g.covered', {}, divisions.map(@renderCoveredOverlay)
      ]
      h 'use.frame', {href: frameID, fill:'transparent', key: 'frame'}
    ]

  createDefs: =>
    patternSize = {width: 100, height: 100}
    {patterns, UUID, frameID, clipID} = @state
    ids = []
    elements = for d in patterns
      id = "#{UUID}-#{d}"
      continue if ids.includes(id)
      ids.push(id)
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
        h 'use', {key: frameID, 'href': frameID}
      ])
    h 'defs', {key: 'defs'}, [
      @createFrame()
      clipPath
      elements...
    ]

  createRect: (d, props)=>
    [bottom,top] = __divisionSize(d)
    t = @props.scale(top)
    y = t
    {width} = @props
    x = 0
    if @props.padWidth
      x -= 5
      width += 10
    height = @props.scale(bottom)-y
    key = props.key or d.id
    h "rect", {x,y, width, height, key, props...}

  renderDivision: (d)=>
    className = classNames({
      definite: d.definite_boundary
      covered: d.covered}, 'lithology')
    {UUID} = @state
    fill = "url(##{UUID}-#{d.patternID})"
    @createRect d, {className, fill}

  renderCoveredOverlay: (d)=>
    return null if not d.covered
    @createRect d, {className: 'covered-area'}

  renderFacies: =>
    {divisions} = @state
    __ = [{divisions[0]...}]
    for d in divisions
      ix = __.length-1
      shouldSkip = not d.facies? or d.facies == __[ix].facies
      if shouldSkip
        __[ix].top = d.top
      else
        __.push {d...}
    return null if __.length == 1
    h 'g.facies', __.map (d)=>
      className = classNames('facies', d.id)
      @createRect d, {className, fill: d.facies_color}

class CoveredColumn extends LithologyColumn
  @defaultProps: {
    width: 5
    padWidth: false
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
    _.moveTo(0,bottomOf(divisions[0]))
    for div in divisions
      x = @grainsizeScale(div.grainsize)
      _.lineTo x, bottomOf(div)
      _.lineTo x, topOf(div)
    _.lineTo 0, topOf(div)
    _.closePath()
    h "path#{frameID}", {d: _.toString()}

module.exports = {LithologyColumn, GeneralizedSectionColumn, CoveredColumn}
