{query} = require '../db'
d3 = require 'd3'
{Component} = require 'react'
h = require 'react-hyperscript'
{Notification} = require '../../notify'
{path} = require 'd3-path'

class FloodingSurface extends Component
  @defaultProps: {
    offsetLeft: -90
    lineWidth: 50
  }

  render: ->
    {scale, zoom, offsetLeft, lineWidth, divisions} = @props
    floodingSurfaces = divisions.filter (d)->d.flooding_surface_order?
    return null unless floodingSurfaces.length
    h 'g.flooding-surface', {},
      floodingSurfaces.map (d)->
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

class TriangleBars extends FloodingSurface
  render: ->
    h 'g.triangle-bars', {}, [
      h 'g.level-1', {}, @renderSurfaces(1)
      h 'g.level-2', {}, @renderSurfaces(2)
    ]

  renderSurfaces: (order)=>
    {scale, zoom, offsetLeft, lineWidth, divisions} = @props
    return null unless divisions.length
    w = lineWidth/2
    ol = offsetLeft+lineWidth*2+5
    __ = []

    column = "surface_type_#{order}"

    for d,i in divisions
      continue unless d[column]?
      height = scale(d.bottom)
      if d[column] == 'mfs'
        __.push ['mfs', height]
      if d[column] == 'sb'
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

    h "path", {d: _.toString(), transform: "translate(#{-lineWidth*order+ol})"}

    #x = offsetLeft
    #transform = "translate(#{x})"
    #h "line.flooding-surface", {
      #transform,
      #key: d.id,
      #strokeWidth: 1
      #stroke: '#444'
      #x1: 0
      #x2: lineWidth/2
      #y1, y2
    #}



module.exports = {FloodingSurface, TriangleBars}

