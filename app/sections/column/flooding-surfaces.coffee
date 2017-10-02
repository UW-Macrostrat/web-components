{query} = require '../db'
d3 = require 'd3'
{Component} = require 'react'
h = require 'react-hyperscript'

class FloodingSurface extends Component
  constructor: (props)->
    super props
    @state =
      floodingSurfaces: []
    @getData()

  getData: ->
    query 'flooding-surface', [@props.id]
      .then (data)=>
        @setState floodingSurfaces: data

  render: ->
    {scale, zoom} = @props
    {floodingSurfaces} = @state

    h 'g.flooding-surface', {},
      floodingSurfaces.map (d)->
        y = scale(d.height)
        x = -90
        transform = "translate(#{x} #{y})"
        h "line.flooding-surface", {
          transform,
          key: d.id,
          strokeWidth: 6-Math.abs(d.flooding_surface_order)
          stroke: if d.flooding_surface_order >= 0 then 'black' else 'red'
          x1: 0
          x2: 50
        }

module.exports = FloodingSurface

