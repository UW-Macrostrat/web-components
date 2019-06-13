import {select} from "d3-selection"
import {Component, PureComponent, createElement} from "react"
import {findDOMNode} from "react-dom"
import h from "react-hyperscript"
import {join} from "path"
import classNames from "classnames"
import {createGrainsizeScale} from "./grainsize"
import {path} from "d3-path"
import * as d3 from "d3"
import {PlatformContext} from "../../platform"
import {FaciesContext} from "../facies"
import {ColumnContext} from "./context"
import T from 'prop-types'
import {SimpleFrame, GrainsizeFrame, ClipToFrame, UUIDComponent} from './frame'

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

__divisionSize = (d)->
  {bottom,top} = d
  if top < bottom
    [top,bottom] = [bottom,top]
  return [bottom, top]

class ColumnRect extends Component
  @contextType: ColumnContext
  @propTypes: {
    division: T.object.isRequired
    padWidth: T.bool
  }
  @defaultProps: {
    padWidth: false
  }
  render: ->
    {scale} = @context
    {division: d, padWidth, key, width, rest...} = @props
    [bottom,top] = __divisionSize(d)
    y = scale(top)
    x = 0
    if padWidth
      x -= 5
      width += 10
    height = scale(bottom)-y
    key ?= d.id
    h "rect", {x,y, width, height, key, rest...}

class FaciesRect extends Component
  @contextType: FaciesContext
  @propTypes: {
    division: T.object.isRequired
  }
  render: ->
    {getFaciesColor} = @context
    {padWidth, width, division} = @props
    {facies, facies_color, id} = division
    fill = getFaciesColor(facies) or facies_color
    className = classNames('facies', id)
    h ColumnRect, {
      division,
      padWidth,
      className,
      fill,
      width
    }

class FaciesColumnInner extends Component
  @contextType: ColumnContext
  @propTypes: {
    width: T.number.isRequired
  }
  render: ->
    {divisions} = @context
    {width, padWidth} = @props

    __ = [{divisions[0]...}]
    for d in divisions
      ix = __.length-1
      shouldSkip = not d.facies? or d.facies == __[ix].facies
      if shouldSkip
        __[ix].top = d.top
      else
        __.push {d...}
    return null if __.length == 1
    h 'g.facies', __.map (div)->
      h FaciesRect, {division: div, width, padWidth}

class DivisionEditOverlay extends Component
  @contextType: ColumnContext
  @defaultProps: {
    onEditInterval: ->
    onHoverInterval: ->
  }
  eventHandler: (fn)=>(d)=> (event)=>
    {scale} = @context
    {top} = event.target.getBoundingClientRect()
    {clientY} = event
    try
      pxFromTop = scale(d.top)+(clientY-top)
      height = scale.invert(pxFromTop)
    catch
      height = null
    fn(d, {height, event})
    event.stopPropagation()

  render: ->
    {divisions} = @context

    clickHandler = @eventHandler(@props.onEditInterval)
    hoverHandler = @eventHandler(@props.onHoverInterval)

    h 'g.edit-overlay', divisions.map (d)=>
      onClick = clickHandler(d)
      onMouseOver = hoverHandler(d)
      className = classNames('edit-overlay', d.id)
      h ColumnRect, {division: d, width: 100, className, fill: 'transparent', onClick, onMouseOver}

class CoveredOverlay extends UUIDComponent
  @contextType: ColumnContext
  constructor: (props)->
    super props
  render: ->
    {divisions} = @context
    {width} = @props
    divs = divisions.filter((d)->d.covered).map (d)=>
      h ColumnRect, {division: d, width, fill: "url(##{@UUID}-covered)"}

    h 'g.covered-overlay', {}, [
      h 'defs', [
        h Lines, {
          id: "#{@UUID}-covered"
          size: 9
          strokeWidth: 3
          stroke: 'rgba(0,0,0,0.5)'
        }
      ]
      divs...
    ]

class SymbolDefinition extends Component
  @contextType: PlatformContext
  @defaultProps: {
    width: 100,
    height: 100
  }
  @propTypes: {
    UUID: T.string.isRequired
  }
  render: ->
    {resolveLithologySymbol} = @context
    {UUID, width, height, id: d} = @props
    patternSize = {width, height}

    id = "#{UUID}-#{d}"

    h 'pattern', {
      id
      key: id
      patternUnits: "userSpaceOnUse"
      patternSize...
    }, [
      h 'image', {
        xlinkHref: resolveLithologySymbol(d)
        x:0,y:0
        patternSize...
      }
    ]

defaultResolveID = (d)->
  if not (d.fgdc_pattern? or d.pattern?)
    return null
  if d.fgdc_pattern?
    return "#{d.fgdc_pattern}"
  return "#{symbolIndex[d.pattern]}"

class LithologyColumnInner extends UUIDComponent
  @contextType: ColumnContext
  @defaultProps: {
    resolveID: defaultResolveID
    minimumHeight: 0
  }
  constructLithologyDivisions: =>
    {divisions} = @context
    {resolveID, minimumHeight} = @props
    __ = []
    for d in divisions
      ix = __.length-1
      patternID = resolveID(d)
      if ix == -1
        __.push {d..., patternID}
        continue
      sameAsLast = patternID == resolveID(__[ix])
      heightTooSmall = d.top-d.bottom < minimumHeight
      shouldSkip = not patternID? or sameAsLast or heightTooSmall
      if shouldSkip
        __[ix].top = d.top
      else
        __.push {d..., patternID}

    return __

  createDefs: (divisions)=>
    {resolveID} = @props
    __ = divisions.map (d)=>resolveID(d)
      .filter((x, i, arr) => arr.indexOf(x) == i)

    h 'defs', __.map (d)=>
      h SymbolDefinition, {UUID: @UUID, id: d}

  renderEach: (d)=>
    className = classNames({
      definite: d.definite_boundary
      covered: d.covered}, 'lithology')
    fill = "url(##{@UUID}-#{d.patternID})"
    h ColumnRect, {width: @props.width, division: d, className, fill}

  render: ->
    divisions = @constructLithologyDivisions()
    h 'g.lithology', {}, [
      @createDefs(divisions)
      h 'g', divisions.map(@renderEach)
    ]


UseFrame = (props)->
  {id: frameID, rest...} = props
  h 'use.frame', {xlinkHref: frameID, fill:'transparent', key: 'frame', rest...}


class LithologyColumn extends UUIDComponent
  @contextType: PlatformContext
  @defaultProps: {
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
  }
  queryID: 'lithology'
  constructor: (props)->
    super props
    @clipID = "#clip-#{@UUID}"
    @frameID = "#frame-#{@UUID}"

  computeTransform: =>
    {left, shiftY} = @props
    return null unless left?
    return "translate(#{left} #{shiftY})"

  render: ->
    {scale, visible,left, shiftY,
        width, children} = @props
    divisions = [] unless visible
    transform = @computeTransform()

    h ClipToFrame, {
      className: 'lithology-column',
      left, shiftY
      frame: (props)=>h(SimpleFrame, {width, props...})
    }, children

  renderCoveredOverlay: =>
    {showCoveredOverlay, showLithology, width} = @props
    if not showCoveredOverlay?
      showCoveredOverlay = showLithology
    return unless showCoveredOverlay
    h CoveredOverlay, {width}

  renderLithology: =>
    return unless @props.showLithology
    {width} = @props
    h LithologyColumnInner, {width}

  renderFacies: =>
    return unless @props.showFacies
    {width} = @props
    h FaciesColumnInner, {width}

  renderEditableColumn: =>
    {onEditInterval, onHoverInterval} = @props
    return unless onEditInterval? or onHoverInterval?
    h DivisionEditOverlay, {onEditInterval, onHoverInterval}

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

simplifiedResolveID = (d)->
  p = symbolIndex[d.fill_pattern]
  return p if p?
  fp = d.fill_pattern
  # Special case for shales since we probably want to emphasize lithology
  if parseInt(fp) == 624
    return defaultResolveID(d)
  else
    return fp

SimplifiedLithologyColumn = (props)->
  h LithologyColumnInner, {
    resolveID: simplifiedResolveID
    props...
  }

GeneralizedSectionColumn = (props)->
  {width, grainsizeScaleStart, children} = props
  grainsizeScaleStart ?= width/4
  range = [grainsizeScaleStart, width]
  h ClipToFrame, {
    className: 'lithology-column'
    frame: (props)=> h GrainsizeFrame, {range, props...}
  }, children

GeneralizedSectionColumn.propTypes = {
  width: T.number.isRequired
  grainsizeScaleStart: T.number
}

export {LithologyColumn, FaciesColumn,
        GeneralizedSectionColumn, CoveredColumn,
        FaciesColumnInner, LithologyColumnInner,
        SimplifiedLithologyColumn,
        CoveredOverlay, DivisionEditOverlay,
        symbolIndex}
