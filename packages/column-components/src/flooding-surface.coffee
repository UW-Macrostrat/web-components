import {query} from "../db"
import * as d3 from "d3"
import {Component, createElement} from "react"
import h from "react-hyperscript"
import {Notification} from "../../notify"
import {path} from "d3-path"
import {ColumnContext} from "./context"
import {UUIDComponent} from './frame'

class FloodingSurface extends Component
  @contextType: ColumnContext
  @defaultProps: {
    offsetLeft: -90
    lineWidth: 50
  }
  render: ->
    {scale, zoom, divisions} = @context
    {offsetLeft, lineWidth} = @props
    floodingSurfaces = divisions.filter (d)->d.flooding_surface_order?
    return null unless floodingSurfaces.length
    h 'g.flooding-surface', null, floodingSurfaces.map (d)->
      y = scale(d.bottom)
      x = offsetLeft
      transform = "translate(#{x} #{y})"
      onClick = null
      if d.note?
        onClick = ->
          Notification.show {
            message: d.note
          }
      h "line.flooding-surface", {
        transform,
        onClick
        key: d.id,
        strokeWidth: 6-Math.abs(d.flooding_surface_order)
        stroke: if d.flooding_surface_order >= 0 then '#444' else '#fcc'
        x1: 0
        x2: lineWidth
      }

class TriangleBars extends UUIDComponent
  @contextType: ColumnContext
  @defaultProps: {
    offsetLeft: -90
    lineWidth: 50
    order: 2
  }

  render: ->
    {offsetLeft, lineWidth, order, orders} = @props
    {scale, zoom, divisions} = @context
    [bottom, top] = scale.range()
    orders ?= [order]

    _ = path()

    zigZagLine = (x0, x1, y, nzigs=5, a=2)->
      #_.moveTo(start...)
      xs = d3.scaleLinear()
        .domain([0,nzigs])
        .range([x0,x1])

      _.lineTo(x0,y)

      for i in [0...nzigs]
        x_ = xs(i)
        y_ = y
        if i%2 == 1
          y_ += a
        _.lineTo(x_,y_)

      _.lineTo(x1,y)


    btm = bottom-top
    _.moveTo(-lineWidth,0)
    zigZagLine(-lineWidth, lineWidth, btm, 16, 3)
    zigZagLine(lineWidth, -lineWidth, 0, 16, 3)
    _.closePath()

    h 'g.triangle-bars', {}, [
      h 'defs', [
        createElement('clipPath', {id: @UUID}, [
          h 'path', {d: _.toString(), key: @UUID+'-path'}
        ])
      ]
      orders.map @renderSurfaces
    ]

  renderSurfaces: (order, index)=>
    {scale, zoom, divisions} = @context
    {offsetLeft, lineWidth} = @props
    return null unless divisions.length
    w = lineWidth/2
    ol = offsetLeft+lineWidth*2+5
    __ = []

    for d,i in divisions
      {surface_type, surface_order} = d
      continue unless (surface_type? and surface_order?)
      continue unless surface_order <= order
      height = scale(d.bottom)
      if surface_type == 'mfs'
        __.push ['mfs', height]
      if surface_type == 'sb'
        if __.length == 0
          __.push ['sb', height]
          continue
        sz = __.length-1
        if __[sz][0] == 'sb'
          __[sz][1] = height
        else
          __.push ['sb', height]

    return null unless __.length

    _ = path()
    basalMFS = null
    sequenceBoundary = null
    for top,i in __
      if top[0] == 'mfs' and basalMFS?
        _.moveTo(0,basalMFS[1])
        if sequenceBoundary?
          _.lineTo(w, sequenceBoundary[1])
          _.lineTo(0, top[1])
          _.lineTo(-w, sequenceBoundary[1])
          _.closePath()
        else
          _.lineTo(w, top[1])
          _.lineTo(-w, top[1])
          _.closePath()
        sequenceBoundary = null
        basalMFS = null
      if top[0] == 'mfs'
        basalMFS = top
      else if top[0] == 'sb'
        sequenceBoundary = top

    h "g.level-#{order}", {
      clipPath: "url(##{@UUID})"
      transform: "translate(#{-lineWidth*(2+index)+ol})"
      key: @UUID+'-'+order
    }, [
      h "path", {d: _.toString(), key: @UUID+'-'+order}
    ]

export {FloodingSurface, TriangleBars}
