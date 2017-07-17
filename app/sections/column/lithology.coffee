{db, storedProcedure} = require '../db'
{select} = require 'd3-selection'
{findSymbol, lithology} = require 'stratigraphic-column/src/sed-patterns'
{Component} = require 'react'
h = require 'react-hyperscript'

module.exports = (el, opts={})->
  opts.width ?= 10
  opts.padding ?= 2
  db.query storedProcedure('lithology'), [opts.id]
    .then (data)->
      # Setup sed patterns
      el.call lithology

      sel = el.selectAll 'rect'
        .data data

      console.log "Setting up lithology column"

      sel.enter()
        .append 'rect'
        .attrs
          class: "lithology"
          x: -opts.padding
          width: opts.width+2*opts.padding
        .classed 'definite', (d)->d.definite_boundary
        .classed 'covered', (d)->d.covered
        .attrs (d)->
          y = opts.scale(d.top)
          height = opts.scale(d.bottom)-y
          fill = findSymbol d.pattern
          {y, height, fill}

class LithologyColumn extends Component
  constructor: ->
    @state =
      divisions: []
    super @props

  render: ->
    {style} = @props
    h 'div.lithology-column', {style},
      @state.divisions.map (d)->
        h 'div'

module.exports = LithologyColumn
