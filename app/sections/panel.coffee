{findDOMNode} = require 'react-dom'
{Component} = require 'react'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
SectionComponent = require './column'
{Dragdealer} = require 'dragdealer'
require 'dragdealer/src/dragdealer.css'
d3 = require 'd3'

class LocationGroup extends Component
  render: ->
    console.log @props.children
    h 'div.location-group', [
      h 'h1', @props.name
      h 'div.location-group-body', {}, @props.children
    ]

class SectionPanel extends Component
  # Zoomable panel containing individual sections
  createSectionElement: (row)=>
    row.key = row.id # Because react
    row.zoom = @props.options.zoom
    row.skeletal = @props.options.activeMode == 'skeleton'
    row.showNotes = @props.options.showNotes
    h SectionComponent, row

  render: ->
    console.log "Rendering section panel"
    console.log @props

    sections = d3.nest()
      .key (d)->d.location
      .entries @props.sections

    children = sections.map ({key,values})=>
      items = values.map @createSectionElement
      h LocationGroup, {key, name: key}, items

    hc = "handle"
    if @props.options.activeMode == 'skeleton'
      hc += " skeletal"

    st = {zoom: @props.options.zoom}
    h "div.dragdealer#section-page", [
      # The actual container in which the sections sit
      h "div#section-page-inner", {className: hc}, children
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
