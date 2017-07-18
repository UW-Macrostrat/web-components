{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
{db, storedProcedure} = require '../db'
uuid = require('uuid/v4')
ReactTooltip = require 'react-tooltip'

class Note extends Component
  render: ->
    {style} = @props
    h 'div.note', {
      onMouseOver: @positioningInfo
      style
    }, @props.d.note

  positioningInfo: =>
    console.log @props.d

class NotesColumn extends Component
  @defaultProps:
    width: 100
    type: 'log-notes'
  constructor: (props)->
    super props
    @state =
      notes: []

    db.query storedProcedure(@props.type), [@props.id]
      .then (data)=>
        console.log data
        @setState notes: data

  render: ->
    style = zoom: @props.zoom

    h 'div.section-log', {style}, @state.notes.map (d)=>
      style =
        top: @props.scale(d.text_height)
      h Note, {style, d}

module.exports = NotesColumn
