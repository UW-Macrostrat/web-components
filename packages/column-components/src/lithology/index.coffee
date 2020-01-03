import {select} from "d3-selection"
import {Component, PureComponent, createElement, useContext} from "react"
import {findDOMNode} from "react-dom"
import h from "react-hyperscript"
import classNames from "classnames"
import {path} from "d3-path"
import T from 'prop-types'
import {SimpleFrame, GrainsizeFrame, ClipToFrame, UUIDComponent} from '../frame'
import {FaciesContext, ColumnContext, ColumnLayoutContext,
        AssetPathContext, ColumnLayoutProvider} from "../context"
import {GeologicPattern, GeologicPatternProvider} from './patterns'
import {createGrainsizeScale} from "../grainsize"

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
  'quartzite': 702
}

isCarbonateSymbol = (d)->
  ###
  Does this FGDC pattern correspond to a carbonate rock?
  ###
  if d < 627
    return false
  if d > 648
    return false
  return true

defaultResolveID = (d)->
  # Changed pattern to lithology
  return null unless d?
  if not (d.fgdc_pattern? or d.pattern?)
    return null
  if d.fgdc_pattern?
    return "#{d.fgdc_pattern}"
  return "#{symbolIndex[d.pattern]}"

carbonateResolveID = (d)->
  # Just whether a carbonate or not
  v = defaultResolveID(d)
  return v if not v?
  return if isCarbonateSymbol(v) then 627 else -1

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
  {
    padWidth,
    parameter: key,
    fillForInterval,
    minimumHeight
  } = props
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

LithologySymbolDefs = (props)->
  {resolveID, divisions, UUID, scalePattern} = props
  scalePattern ?= -> 1
  divisions ?= useContext(ColumnContext).divisions

  __ = divisions
    .map (d)->resolveID(d)
    .filter((x, i, arr) -> arr.indexOf(x) == i)

  h 'defs', __.map (id, i)->
    return null if id == -1
    sz = 100
    if scalePattern?
      scalar = scalePattern(id)
      sz *= scalar
    h GeologicPattern, {key: i, UUID, id, width: sz, height: sz}

class LithologyBoxes extends UUIDComponent
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
      shouldSkip = not patternID? or sameAsLast
      if shouldSkip
        __[ix].top = d.top
      else
        __.push {d..., patternID}

    # Allow removing of items by minimum height
    if minimumHeight > 0
      nextVals = []
      for d, i in __
        heightTooSmall = d.top-d.bottom < minimumHeight
        if heightTooSmall and __[i+1]?
          __[i+1].bottom = d.bottom
          __[i+1].patternID ?= resolveID(d)
        else
          nextVals.push(d)
      return nextVals
    return __

  renderEach: (d)=>
    {width} = @context
    className = classNames({
      definite: d.definite_boundary
      covered: d.covered}, 'lithology')
    fill = "url(##{@UUID}-#{d.patternID})"
    if d.patternID == -1
      fill = 'transparent'
    h ColumnRect, {width, division: d, className, fill}

  render: ->
    divisions = @constructLithologyDivisions()
    {resolveID} = @props
    h 'g.lithology', [
      h LithologySymbolDefs, {
        divisions,
        resolveID,
        @UUID
      }
      h 'g', divisions.map(@renderEach)
    ]

LithologyColumnInner = LithologyBoxes

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

CarbonateDivisions = (props)->
  h LithologyColumnInner, {
    resolveID: carbonateResolveID
    props...
  }

export * from './patterns'
export {ParameterIntervals,
        LithologyColumn,
        LithologyBoxes,
        GeneralizedSectionColumn,
        defaultResolveID
        FaciesColumnInner,
        LithologySymbolDefs,
        LithologyColumnInner,
        CarbonateDivisions,
        SimplifiedLithologyColumn,
        CoveredOverlay,
        SimpleFrame,
        GrainsizeFrame,
        ColumnRect,
        symbolIndex}
