{findDOMNode} = require 'react-dom'
{Component} = require 'react'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
SectionComponent = require './column'
{Dragdealer} = require 'dragdealer'
require 'dragdealer/src/dragdealer.css'
d3 = require 'd3'

class SectionColumn extends Component
  render: ->
    h 'div.section-column', {}, @props.children

class LocationGroup extends Component
  render: ->
    h 'div.location-group', [
      h 'h1', @props.name
      h 'div.location-group-body', {}, @props.children
    ]

groupOrder = [
  'Tsams'
  'Onis'
  'Ubisis'
]

stackGroups = [
  'AC'
  'ED'
  'FG'
  'HI'
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

    stackGroup = (d)=>
      if @props.options.condensedDisplay
        for g in stackGroups
          if g.indexOf(d.id) != -1
            return g
      return d.id

    sectionGroups = d3.nest()
      .key (d)->d.location
      .key stackGroup
      .entries @props.sections

    sectionGroups.sort (a,b)->
      groupOrder.indexOf(a.key)-groupOrder.indexOf(b.key)

    children = sectionGroups.map ({key,values})=>
      h LocationGroup, {key, name: key},
        values.map ({key,values})=>
          values.sort (a, b)-> b.offset-a.offset
          console.log key, values
          h SectionColumn, values.map @createSectionElement

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
    {x,y} = @props.options.dragPosition
    new Dragdealer _el, {
      x,y
      loose: true
      vertical: true, requestAnimationFrame: true
      callback: @setPosition}

  setPosition: (x,y)=>
    @props.updatePosition {x,y}

module.exports = SectionPanel
