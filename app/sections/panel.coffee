{findDOMNode} = require 'react-dom'
{Component} = require 'react'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
{SectionComponent} = require './column'
{Dragdealer} = require 'dragdealer'
require './main.styl'
require 'dragdealer/src/dragdealer.css'
d3 = require 'd3'
{debounce} = require 'underscore'
Measure = require('react-measure').default

class SectionColumn extends Component
  render: ->
    h 'div.section-column', {}, @props.children

class LocationGroup extends Component
  render: ->
    h 'div.location-group', [
      h 'h1', @props.name
      h 'div.location-group-body', {}, @props.children
    ]

class SectionPanel extends Component
  # Zoomable panel containing individual sections
  @defaultProps:
    activeMode: 'normal'
    zoom: 1
    showNotes: true
    groupOrder: [
      'Tsams'
      'Onis'
      'Ubisis'
    ]
    stackGroups: ['AC','BD','FG','HI']
    sections: []
    trackVisibility: true
    onResize: ->
  constructor: (props)->
    super props

  render: ->
    console.log "Rendering section panel"
    {stackGroups, groupOrder} = @props

    stackGroup = (d)=>
      for g in stackGroups
        if g.indexOf(d.key) != -1
          return g
      return d.id

    indexOf = (arr)->(d)->
      arr.indexOf(d)

    __ix = indexOf(stackGroups)

    sectionGroups = d3.nest()
      .key (d)->d.props.location or ""
      .key stackGroup
      .sortKeys (a,b)->__ix(a)-__ix(b)
      .entries @props.children

    g = sectionGroups.find (d)->d.key == ""
    extraItems = if g? then g.values[0].values else []
    sectionGroups = sectionGroups.filter (d)->d.key != ""

    __ix = indexOf(groupOrder)
    sectionGroups.sort (a,b)->__ix(a.key)-__ix(b.key)

    __ = sectionGroups.map ({key,values})=>
      h LocationGroup, {key, name: key},
        values.map ({key,values})=>
          values.sort (a, b)-> b.offset-a.offset
          h SectionColumn, values

    children = [__...,extraItems...]

    hc = "handle"
    if @props.activeMode == 'skeleton'
      hc += " skeletal"
    if @props.zoom < 0.5
      hc += " zoomed-out"
    if @props.zoom < 0.1
      hc += " zoomed-way-out"

    {onResize} = @props
    h Measure, {bounds: true, onResize}, ({measureRef})->
      h "div#section-page-inner", {className: hc, ref: measureRef}, children

class ZoomablePanelContainer extends Component
  # Zoomable panel container

  render: ->
    {options, sections} = @props
    {dragdealer, dragPosition, rest...} = options
    className = if dragdealer then "dragdealer" else ""

    {x,y} = dragPosition
    scroll = {scrollTop: y, scrollLeft: x}
    h "div#section-page", {className, key: className, scroll...}, [
      # The actual container in which the sections sit
      # Uncritically forward all props for now...
      h SectionPanel, { rest...}, @props.children
    ]

  componentDidMount: ->
    console.log "Section page mounted"
    _el = findDOMNode @
    el = _el.childNodes[0]
    {x,y} = @props.options.dragPosition
    if not @props.options.dragdealer
      fn = =>
        ypos = el.scrollTop
        xpos = el.scrollLeft
        console.log xpos,ypos
        @props.updatePosition x:xpos, y:ypos

      d3.select(_el).on "scroll", debounce(fn, 500)
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
    console.log "Setting drag position to #{x},#{y}"
    @props.updatePosition {x,y}

  toggleDragdealer: =>
    if @props.options.dragdealer and @dragdealer?
      @dragdealer.enable()
    else
      @dragdealer.disable()

module.exports = {SectionPanel,ZoomablePanelContainer}
