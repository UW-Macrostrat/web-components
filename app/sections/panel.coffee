{findDOMNode} = require 'react-dom'
{Component} = require 'react'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
SectionComponent = require './column'
{Dragdealer} = require 'dragdealer'
require 'dragdealer/src/dragdealer.css'

class SectionPanel extends Component
  # Zoomable panel containing individual sections
  render: ->
    console.log "Rendering section panel"
    console.log @props
    children = @props.sections.map (row)=>
      row.key = row.id # Because react
      row.zoom = @props.options.zoom
      row.skeletal = @props.options.activeMode == 'skeleton'
      row.showNotes = @props.options.showNotes
      h SectionComponent, row

    st = {zoom: @props.options.zoom}
    h 'div.dragdealer#section-page', [
      # The actual container in which the sections sit
      h 'div#section-page-inner.handle', children
    ]

  componentDidMount: ->
    console.log "Section page mounted"
    _el = findDOMNode @
    console.log Dragdealer
    new Dragdealer _el, {
      x: 0, y: 0,
      loose: true
      vertical: true, requestAnimationFrame: true
      callback: @setPosition}

  setPosition: (x,y)=>
    console.log x,y

module.exports = SectionPanel
