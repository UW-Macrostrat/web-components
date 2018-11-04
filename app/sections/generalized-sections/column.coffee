d3 = require 'd3'
require 'd3-selection-multi'
h = require 'react-hyperscript'
{findDOMNode} = require 'react-dom'
Measure = require('react-measure').default
{Component, createElement, createRef} = require 'react'
classNames = require 'classnames'

{BaseSVGSectionComponent} = require '../summary-sections/column'
{SectionAxis} = require '../column/axis'
{GeneralizedSectionColumn, FaciesColumn, LithologyColumn} = require '../column/lithology'
{FaciesContext} = require '../facies-descriptions'
{SVGNamespaces} = require '../util'
{SequenceStratConsumer} = require '../sequence-strat-context'
{TriangleBars} = require '../column/flooding-surface'

class SimplifiedLithologyColumn extends LithologyColumn

  resolveID: (d)->
    {pattern} = d
    return null if not pattern?
    console.log pattern
    if ['dolomite', 'dolomite-limestone',
        'sandy-dolomite', 'lime_mudstone'].includes(pattern)
      pattern = 'limestone'
    return "#{@symbolIndex[pattern]}"

  constructLithologyDivisions: =>
    {divisions} = @props
    __ = []
    for d in divisions
      ix = __.length-1
      patternID = @resolveID(d)
      if ix == -1
        __.push {d..., patternID}
        continue
      sameAsLast = patternID == @resolveID(__[ix])
      heightTooSmall = d.top-d.bottom < 2
      shouldSkip = not patternID? or sameAsLast or heightTooSmall
      if shouldSkip
        __[ix].top = d.top
      else
        __.push {d..., patternID}
    return __

  render: ->
    {scale, left, shiftY,
        width, height, divisions} = @props

    {clipID, frameID} = @state
    transform = @computeTransform()
    onClick = @onClick
    clipPath = "url(#{clipID})"
    h 'g.lithology-column', {transform, onClick},[
      @createDefs()
      h 'g', {className: 'lithology-inner', clipPath}, [
        @renderLithology()
      ]
      h 'use.frame', {xlinkHref: '#frame-'+@UUID, fill:'transparent', key: 'frame'}
    ]

class GeneralizedSVGSectionBase extends Component
  @defaultProps: {pixelsPerMeter: 20, zoom: 1, showLithology: false}
  constructor: (props)->
    super props

  renderTriangleBars: ->
    {showTriangleBars,
     id, divisions, sequenceStratOrder} = @props
    return null unless showTriangleBars
    h TriangleBars, {
      id, divisions,
      scale: @getScale(),
      order: sequenceStratOrder
      lineWidth: 20
      offsetLeft: -30
    }

  getScale: (v='local')->
    @props.position.heightScale[v]

  getSize: ->
    {width, height} = @props.position

  renderLithology: ->
    {showLithology, divisions, id} = @props
    return null unless showLithology
    {width, height} = @getSize()
    scale = @getScale()
    h SimplifiedLithologyColumn, {
      width
      height
      divisions
      scale
      id
    }

  render: ->
    { id,
      showFacies,
      divisions,
      position,
      facies } = @props

    {x: left, y: top, width, height, heightScale} = position

    scale = heightScale.local

    divisions = divisions.filter (d)->not d.schematic

    transform = "translate(#{left} #{top})"

    h "g.section", {transform, key: id}, [
      h FaciesColumn, {
        width
        height
        facies
        divisions
        showFacies
        scale
        id
      }
      @renderLithology()
      @renderTriangleBars()
    ]

class GeneralizedSVGSection extends Component
  render: ->
    h FaciesContext.Consumer, null, ({facies})=>
      h SequenceStratConsumer, null, ({actions, rest...})=>
        props = {@props..., facies, rest...}
        h GeneralizedSVGSectionBase, props


module.exports = {GeneralizedSVGSection}
