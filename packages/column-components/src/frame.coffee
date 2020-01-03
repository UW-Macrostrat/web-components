import {Component, createElement, useState} from "react"
import h from "react-hyperscript"
import {path} from "d3-path"
import {ColumnLayoutContext} from "./context"
import T from 'prop-types'
import {v4} from "uuid"

class UUIDComponent extends Component
  constructor: (props)->
    super props
    @UUID = v4()

useUUID = ->
  return useState(v4())[0]

class SimpleFrame extends Component
  @contextType: ColumnLayoutContext
  @propTypes: {
    id: T.string.isRequired
  }
  render: ->
    {pixelHeight: height, width} = @context
    {id: frameID} = @props
    if frameID.startsWith("#")
      frameID = frameID.slice(1)
    h "rect", {id: frameID, x:0,y:0,width,height, key: frameID}

class GrainsizeFrame extends Component
  @contextType: ColumnLayoutContext
  render: ->
    {scale, divisions, grainsizeScale: gs} = @context
    if not gs?
      throw "GrainsizeFrame must be a child of a GrainsizeScaleProvider"
    {id: frameID} = @props
    if frameID.startsWith("#")
      frameID = frameID.slice(1)
    if divisions.length == 0
      return null

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

    filteredDivisions = divisions.filter (d)->
      return false if d.top <= bottomOfSection
      return false if d.bottom > topOfSection
      return true

    _ = null
    currentGrainsize = 'm'
    for div in filteredDivisions
      if not _?
        _ = path()
        _.moveTo(0,bottomOf(div))
      if div.grainsize?
        currentGrainsize = div.grainsize
      x = gs(currentGrainsize)
      _.lineTo x, bottomOf(div)
      _.lineTo x, topOf(div)
    _.lineTo 0, topOf(div)
    _.closePath()

    h "path", {id: frameID, key: frameID, d: _.toString()}

ClipPath = (props)->
  {id, children, rest...} = props
  if id.startsWith('#')
    id = id.slice(1)
  createElement('clipPath', {id, key: id, rest...}, children)

UseFrame = (props)->
  {id: frameID, rest...} = props
  h 'use.frame', {xlinkHref: frameID, fill:'transparent', key: 'frame', rest...}

prefixID = (uuid, prefixes)->
  res = {}
  for prefix in prefixes
    res[prefix+"ID"] = "##{uuid}-#{prefix}"
  return res

widthOrFrame = (props, propName)->
  {width, frame} = props
  widthExists = width?
  frameExists = frame?
  return if widthExists or frameExists
  return new Error "Provide either 'width' or 'frame' props"

class ClipToFrame extends UUIDComponent
  @defaultProps: {
    onClick: null
    shiftY: 0
  }
  @propTypes: {
    left: T.number
    shiftY: T.number
    onClick: T.func
    frame: widthOrFrame
    width: widthOrFrame
  }
  computeTransform: =>
    {left, shiftY} = @props
    return null unless left?
    return "translate(#{left} #{shiftY})"
  render: ->
    {children, frame, className, onClick} = @props
    if not frame?
      {width} = @props
      frame = (props)=>h(SimpleFrame, {width, props...})

    transform = @computeTransform()
    {frameID, clipID} = prefixID @UUID, ["frame", "clip"]

    h 'g', {className, transform, onClick},[
      h 'defs', {key: 'defs'}, [
        h frame, {id: frameID}
        h ClipPath, {id: clipID}, h(UseFrame, {id: frameID})
      ]
      h 'g.inner', {
        clipPath: "url(#{clipID})"
      }, children
      h UseFrame, {id: frameID}
    ]

export {
  SimpleFrame,
  GrainsizeFrame,
  ClipPath,
  UUIDComponent,
  ClipToFrame,
  useUUID
}
