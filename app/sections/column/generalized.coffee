import * as d3 from "d3"
import "d3-selection-multi"
import h from "react-hyperscript"
import {findDOMNode} from "react-dom"
Measure = require('react-measure').default
import {Component, createElement, createRef} from "react"
import classNames from "classnames"

import {BaseSVGSectionComponent} from "./summary"
import {SectionAxis} from "./axis"
import {ClipToFrame} from "./frame"
import {
  FaciesColumnInner,
  LithologyColumnInner, symbolIndex
} from "./lithology"
import {FaciesContext} from "../facies"
import {SVGNamespaces} from "../util"
import {SequenceStratConsumer} from "../sequence-strat-context"
import {TriangleBars} from "./flooding-surface"
import {ColumnProvider} from "./context"

resolveID = (d)->
  {pattern} = d
  return null if not pattern?
  if ['dolomite', 'dolomite-limestone',
      'sandy-dolomite', 'lime_mudstone'].includes(pattern)
    pattern = 'limestone'
  return "#{symbolIndex[pattern]}"


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

  renderFacies: ->
    {showFacies} = @props
    {width} = @props.position
    return null unless showFacies
    h FaciesColumnInner, {width}

  renderLithology: ->
    {showLithology} = @props
    {width} = @props.position
    return null unless showLithology
    h LithologyColumnInner, {
      resolveID
      minimumHeight: 2
      width
    }

  render: ->
    { id,
      showFacies,
      divisions,
      position,
      facies } = @props

    {x: left, y: top, width, heightScale} = position
    {pixelsPerMeter, height} = heightScale.props

    divisions = divisions.filter (d)->not d.schematic

    transform = "translate(#{left} #{top})"
    h ColumnProvider, {
      height, divisions, pixelsPerMeter
    }, [
      h "g.section", {transform, key: id}, [
        h ClipToFrame, {
          width
          className: 'lithology-column'
        }, [
          @renderFacies()
          @renderLithology()
        ]
        @renderTriangleBars()
      ]
    ]

class GeneralizedSVGSection extends Component
  render: ->
    h FaciesContext.Consumer, null, ({facies})=>
      h SequenceStratConsumer, null, ({actions, rest...})=>
        props = {@props..., facies, rest...}
        h GeneralizedSVGSectionBase, props


export {GeneralizedSVGSection}
