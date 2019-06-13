import {Component, createElement} from "react"
import h from "react-hyperscript"
import {path} from "d3-path"
import {ColumnContext} from "./context"
import T from 'prop-types'

class SimpleFrame extends Component
  @contextType: ColumnContext
  render: ->
    {pixelHeight: height} = @context
    {width, id: frameID} = @props
    if frameID.startsWith("#")
      frameID = frameID.slice(1)
    h "rect", {id: frameID, x:0,y:0,width,height, key: frameID}

class GrainsizeFrame extends Component
  @contextType: ColumnContext
  render: ->
    {scale, divisions, grainsizeScale} = @context
    {id: frameID, range} = @props
    if frameID.startsWith("#")
      frameID = frameID.slice(1)
    gs = grainsizeScale(range)
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

export {SimpleFrame, GrainsizeFrame, ClipPath}
