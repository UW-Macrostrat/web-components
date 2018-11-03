d3 = require 'd3'
require 'd3-selection-multi'
h = require 'react-hyperscript'
{findDOMNode} = require 'react-dom'
Measure = require('react-measure').default
{Component, createElement, createRef} = require 'react'

{BaseSVGSectionComponent} = require '../summary-sections/column'
{SectionAxis} = require '../column/axis'
{GeneralizedSectionColumn, FaciesColumn, LithologyColumn} = require '../column/lithology'
{FaciesContext} = require '../facies-descriptions'
{SVGNamespaces} = require '../util'
{SequenceStratConsumer} = require '../sequence-strat-context'
{TriangleBars} = require '../column/flooding-surface'

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
    h LithologyColumn, {
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
