{select} = require 'd3-selection'
{Component, createElement} = require 'react'
{findDOMNode} = require 'react-dom'
h = require 'react-hyperscript'
{join} = require 'path'
{v4} = require 'uuid'
classNames = require 'classnames'
{createGrainsizeScale} = require './grainsize'
{path} = require 'd3-path'
d3 = require 'd3'
{PlatformContext} = require '../../platform'

# Malformed es6 module
v = require('react-svg-textures')
if v.default?
  v = v.default
{Lines} = v

symbolIndex = {
  'dolomite-limestone': 641
  'lime_mudstone': 627
  'sandstone': 607
  'siltstone': 616
  'dolomitic siltstone': 616
  'shale': 620
  'limestone': 627
  'dolomite': 642
  'conglomerate': 602
  'dolomite-mudstone': 642
  'mudstone': 620
  'sandy-dolomite': 645
}

resolveSymbol = (id)->
  try
    if PLATFORM == ELECTRON
      q = require.resolve "geologic-patterns/assets/png/#{id}.png"
      return 'file://'+q
    else
      return join BASE_URL, 'assets','lithology-patterns', "#{id}.png"
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
    # Should align exactly with centerline of stroke
    shiftY: 0.5
    divisions: []
    height: 100
    visible: true
    left: 0
    showFacies: false
    showLithology: true
    padWidth: true
    onEditInterval: null
  queryID: 'lithology'
  constructor: (props)->
    super props
    @UUID = v4()
    @state = {
      UUID: @UUID
      frameID: "#frame-#{@UUID}"
      clipID: "#clip-#{@UUID}"
    }

  resolveID: (d)->
    if not (d.fgdc_pattern? or d.pattern?)
      return null
    if d.fgdc_pattern?
      return "#{d.fgdc_pattern}"
    return "#{symbolIndex[d.pattern]}"

  createFrame: (setID=true)->
    {width, height} = @props
    frameID = null
    if setID
      frameID = 'frame-'+@UUID
    h "rect", {id: frameID, x:0,y:0,width,height, key: frameID}

  render: ->
    {scale, visible,left, shiftY,
        width, height, divisions} = @props
    {clipID, frameID} = @state
    divisions = [] unless visible
    transform = null
    if left?
      transform = "translate(#{left} #{shiftY})"

    onClick = @onClick
    clipPath = "url(#{clipID})"
    h 'g.lithology-column', {transform, onClick},[
      @createDefs()
      h 'g', {className: 'lithology-inner', clipPath}, [
        @renderFacies()
        @renderLithology()
        @renderCoveredOverlay()
      ]
      h 'use.frame', {xlinkHref: '#frame-'+@UUID, fill:'transparent', key: 'frame'}
      @renderEditableColumn()
    ]

  createDefs: =>
    patternSize = {width: 100, height: 100}
    {divisions} = @props
    {UUID, frameID, clipID} = @state
    patterns = divisions
      .map (d)=>@resolveID(d)
      .filter((x, i, arr) => arr.indexOf(x) == i)

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
          xlinkHref: resolveSymbol(d)
          x:0,y:0
          patternSize...
        }
      ]

    h 'defs', {key: 'defs'}, [
      @createFrame()
      createElement('clipPath', {id: clipID.slice(1), key: clipID}, [
        @createFrame(false)
      ])
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

  renderCoveredOverlay: =>
    {showCoveredOverlay, showLithology, divisions} = @props
    {UUID} = @state
    if not showCoveredOverlay?
      showCoveredOverlay = showLithology
    return unless showCoveredOverlay

    divs = divisions.map (d)=>
      return null if not d.covered
      @createRect d, {fill: "url(##{UUID}-covered)"}

    line = h(Lines, {
      id: "#{UUID}-covered"
      size: 8
      stroke: 'rgba(0,0,0,0.3)'
    })

    h 'g.covered-overlay', {}, [
      h 'defs', [line]
      divs...
    ]

  renderLithology: =>
    return unless @props.showLithology
    {divisions} = @props
    {UUID} = @state
    __ = []
    for d in divisions
      ix = __.length-1
      patternID = @resolveID(d)
      if ix == -1
        __.push {d..., patternID}
        continue
      sameAsLast = patternID == @resolveID(__[ix])
      shouldSkip = not patternID? or sameAsLast
      if shouldSkip
        __[ix].top = d.top
      else
        __.push {d..., patternID}

    h 'g.lithology', {}, __.map (d)=>
      className = classNames({
        definite: d.definite_boundary
        covered: d.covered}, 'lithology')
      fill = "url(##{UUID}-#{d.patternID})"
      @createRect d, {className, fill}

  renderFacies: =>
    return unless @props.showFacies
    {divisions, facies} = @props
    faciesColorMap = {}
    if facies?
      # We have responsive facies!
      for f in facies
        faciesColorMap[f.id] = f.color

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
      @createRect d, {className, fill: faciesColorMap[d.facies] or d.facies_color}

  renderEditableColumn: =>
    return unless @props.onEditInterval?
    {divisions, scale} = @props
    clickHandler = (d)=> (event)=>
      {top} = event.target.getBoundingClientRect()
      {clientY} = event
      pxFromTop = scale(d.top)+(clientY-top)
      height = scale.invert(pxFromTop)
      @props.onEditInterval(d, {height, event})
      event.stopPropagation()
    h 'g.edit-overlay', divisions.map (d)=>
      onClick = clickHandler(d)
      className = classNames('edit-overlay', d.id)
      @createRect d, {className, fill: 'transparent', onClick}

class CoveredColumn extends LithologyColumn
  @defaultProps: {
    width: 5
    padWidth: false
    showCoveredOverlay: true
  }
  constructor: (props)->
    super props
  render: ->
    {scale, left, divisions} = @props
    {width, height} = @props
    transform = null
    left ?= -width
    if left?
      transform = "translate(#{left})"

    h 'g.lithology-column.covered-column', {transform},[
      @renderCoveredOverlay()
    ]

class FaciesColumn extends LithologyColumn
  @defaultProps:
    showFacies: true
    showLithology: false
    editable: true

class GeneralizedSectionColumn extends LithologyColumn
  constructor: (props)->
    super props
    @createGrainsizeScale(props)
  componentWillUpdate: (props)->
    @createGrainsizeScale(props)
  createGrainsizeScale: (props)->
    {width, grainsizeScaleStart} = props
    grainsizeScaleStart ?= width/4
    @grainsizeScale = createGrainsizeScale([grainsizeScaleStart, width])
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
    {scale, divisions, position, id} = @props
    {frameID} = @state
    if divisions.length == 0
      return super.createFrame()

    [bottomOfSection, topOfSection] = scale.domain()

    topOf = (d)->
      {top} = d
      if top > topOfSection
        top = topOfSection
      scale(top)
    bottomOf = (d)->
      {bottom} = d
      if bottom < bottomOfSection
        bottom = bottomOfSection
      scale(bottom)

    _ = null
    currentGrainsize = 'm'
    for div in divisions
      continue if div.top <= bottomOfSection
      if not _?
        _ = path()
        _.moveTo(0,bottomOf(div))
      break if div.bottom > topOfSection

      if div.grainsize?
        currentGrainsize = div.grainsize
      x = @grainsizeScale(currentGrainsize)
      _.lineTo x, bottomOf(div)
      _.lineTo x, topOf(div)
    _.lineTo 0, topOf(div)
    _.closePath()
    h "path#{frameID}", {key: frameID, d: _.toString()}

module.exports = {LithologyColumn, FaciesColumn,
                  GeneralizedSectionColumn, CoveredColumn}
