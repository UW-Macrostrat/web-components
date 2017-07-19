{findDOMNode} = require 'react-dom'
{Component} = require 'react'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
SectionComponent = require './column'
{Dragdealer} = require 'dragdealer'
require 'dragdealer/src/dragdealer.css'
d3 = require 'd3'
_ = require 'underscore'

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
          h SectionColumn, values.map @createSectionElement

    hc = "handle"
    if @props.options.activeMode == 'skeleton'
      hc += " skeletal"
    if @props.options.zoom < 0.5
      hc += " zoomed-out"
    if @props.options.zoom < 0.1
      hc += " zoomed-way-out"

    st = {zoom: @props.options.zoom}

    {dragdealer} = @props.options
    className = if dragdealer then "dragdealer" else ""

    h "div#section-page", {className, key: className}, [
      # The actual container in which the sections sit
      h "div#section-page-inner", {
        className: hc}, children
    ]

  componentDidMount: ->
    console.log "Section page mounted"
    _el = findDOMNode @
    el = _el.childNodes[0]
    {x,y} = @props.options.dragPosition
    if not @props.options.dragdealer
      fn = =>
        ypos = _el.scrollTop/el.clientHeight
        xpos = _el.scrollLeft/el.clientWidth
        console.log xpos,ypos
        @setPosition xpos, ypos

      d3.select(_el).on "scroll", _.debounce(fn, 500)
      _el.scrollTop = y*el.clientHeight
      _el.scrollLeft = x*el.clientWidth
    else
      @dragdealer = new Dragdealer _el, {
        x,y
        loose: true
        vertical: true, requestAnimationFrame: true
        callback: @setPosition}
      @toggleDragdealer()

  componentDidUpdate: (prevProps)->
    if prevProps.options.dragdealer != @props.options.dragdealer
      @toggleDragdealer()

  setPosition: (x,y)=>
    @props.updatePosition {x,y}

  toggleDragdealer: =>
    if @props.options.dragdealer and @dragdealer?
      @dragdealer.enable()
    else
      @dragdealer.disable()

module.exports = SectionPanel
