{query} = require '../db'
d3 = require 'd3'
{Component} = require 'react'
h = require 'react-hyperscript'
{Notification} = require '../../notify'

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

module.exports = {FloodingSurface}

