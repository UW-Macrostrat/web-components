import {select} from "d3-selection"
import {Component, PureComponent, createElement, useContext} from "react"
import {findDOMNode} from "react-dom"
import h from "react-hyperscript"
import {join} from "path"
import classNames from "classnames"
import {path} from "d3-path"
import T from 'prop-types'
import {SimpleFrame, GrainsizeFrame, ClipToFrame, UUIDComponent} from './frame'
import {FaciesContext, ColumnContext, ColumnLayoutContext,
        AssetPathContext, ColumnLayoutProvider} from "./context"
import {createGrainsizeScale} from "./grainsize"

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

ParameterIntervals = (props)->
  {divisions, width} = useContext(ColumnLayoutContext)
  {padWidth, parameter: key, fillForInterval} = props
  __ = [{divisions[0]...}]
  for d in divisions
    ix = __.length-1
    shouldSkip = not d[key]? or d[key] == __[ix][key]
    if shouldSkip
      __[ix].top = d.top
    else
      __.push {d...}
  return null if __.length == 1
  h 'g', {className: key}, __.map (div)->
    h ColumnRect, {
      className: classNames(key, div.id)
      division: div,
      padWidth,
      fill: fillForInterval(div[key], div),
      width
    }

ParameterIntervals.propTypes = {
  padWidth: T.number
  parameter: T.string.isRequired
  fillForInterval: T.func.isRequired
}

FaciesColumnInner = (props)->
  {getFaciesColor} = useContext(FaciesContext)
  h ParameterIntervals, {
    parameter: 'facies'
    fillForInterval: (param, division)->
      {facies, facies_color} = division
      getFaciesColor(facies) or facies_color
    props...
  }

class CoveredOverlay extends UUIDComponent
  @contextType: ColumnLayoutContext
  render: ->
    {divisions, width} = @context
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
  @contextType: AssetPathContext
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
  # Changed pattern to lithology
  if not (d.fgdc_pattern? or d.pattern?)
    return null
  if d.fgdc_pattern?
    return "#{d.fgdc_pattern}"
  return "#{symbolIndex[d.pattern]}"

class LithologyColumnInner extends UUIDComponent
  @contextType: ColumnLayoutContext
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
    {width} = @context
    className = classNames({
      definite: d.definite_boundary
      covered: d.covered}, 'lithology')
    fill = "url(##{@UUID}-#{d.patternID})"
    h ColumnRect, {width, division: d, className, fill}

  render: ->
    divisions = @constructLithologyDivisions()
    h 'g.lithology', {}, [
      @createDefs(divisions)
      h 'g', divisions.map(@renderEach)
    ]

class LithologyColumn extends Component
  @defaultProps: {
    # Should align exactly with centerline of stroke
    shiftY: 0.5
    left: 0
  }
  @propTypes: {
    width: T.number.isRequired
  }
  computeTransform: =>
    {left, shiftY} = @props
    return null unless left?
    return "translate(#{left} #{shiftY})"

  render: ->
    {left, shiftY, width, children} = @props
    transform = @computeTransform()

    h ColumnLayoutProvider, {width}, [
      h ClipToFrame, {
        className: 'lithology-column',
        left, shiftY
        frame: SimpleFrame
      }, children
    ]

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
  {children, frame, rest...} = props
  frame ?= GrainsizeFrame
  h ClipToFrame, {
    className: 'lithology-column'
    frame
    rest...
  }, children

export {ParameterIntervals,
        LithologyColumn,
        GeneralizedSectionColumn,
        FaciesColumnInner, LithologyColumnInner,
        SimplifiedLithologyColumn,
        CoveredOverlay,
        SimpleFrame,
        GrainsizeFrame
        symbolIndex}
