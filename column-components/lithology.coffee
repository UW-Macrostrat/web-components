import {select} from "d3-selection"
import {Component, PureComponent, createElement, useContext} from "react"
import {findDOMNode} from "react-dom"
import h from "react-hyperscript"
import {join} from "path"
import classNames from "classnames"
import {path} from "d3-path"
import T from 'prop-types'
import {SimpleFrame, GrainsizeFrame, ClipToFrame, UUIDComponent} from './frame'
import {FaciesContext, ColumnContext, AssetPathContext} from "./context"
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

class CoveredOverlay extends UUIDComponent
  @contextType: ColumnContext
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

oldResolveID = (d)->
  if not (d.fgdc_pattern? or d.pattern?)
    return null
  if d.fgdc_pattern?
    return "#{d.fgdc_pattern}"
  return "#{symbolIndex[d.pattern]}"

defaultResolveID = (d)->
  # Changed pattern to lithology
  if not (d.fgdc_pattern? or d.lithology?)
    return null
  if d.fgdc_pattern?
    return "#{d.fgdc_pattern}"
  return "#{symbolIndex[d.lithology]}"

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
      console.log patternID
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

class LithologyColumn extends Component
  @defaultProps: {
    width: 100
    # Should align exactly with centerline of stroke
    shiftY: 0.5
    left: 0
  }
  computeTransform: =>
    {left, shiftY} = @props
    return null unless left?
    return "translate(#{left} #{shiftY})"

  render: ->
    {scale, left, shiftY,
        width, children} = @props
    transform = @computeTransform()

    h ClipToFrame, {
      className: 'lithology-column',
      left, shiftY
      frame: (props)=>h(SimpleFrame, {width, props...})
    }, children

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
  {width, grainsizeScaleStart} = useContext(ColumnContext)
  {children, range} = props
  grainsizeScaleStart ?= width/4
  range ?= [grainsizeScaleStart, width]
  h ClipToFrame, {
    className: 'lithology-column'
    frame: (props)=> h GrainsizeFrame, {range, props...}
  }, children

export {LithologyColumn,
        GeneralizedSectionColumn,
        FaciesColumnInner, LithologyColumnInner,
        SimplifiedLithologyColumn,
        CoveredOverlay,
        symbolIndex}
