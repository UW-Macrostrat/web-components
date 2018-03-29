{findDOMNode} = require 'react-dom'
{Component} = require 'react'
{select} = require 'd3-selection'
h = require 'react-hyperscript'
{SectionComponent} = require '../column'
require '../main.styl'
d3 = require 'd3'
{debounce} = require 'underscore'
Measure = require('react-measure').default

class SectionColumn extends Component
  render: ->
    h 'div.section-column', {}, @props.children

class LocationGroup extends Component
  render: ->
    {width, name, children, rest...} = @props
    width ?= null
    h 'div.location-group', {style: {width}, rest...}, [
      h 'h1', {style: {height: '3em'}}, name
      h 'div.location-group-body', {}, children
    ]

class SectionPanel extends Component
  # Zoomable panel containing individual sections
  @defaultProps:
    activeMode: 'normal'
    zoom: 1
    showNotes: true
    groupOrder: [
      'Onis'
      'Ubisis'
      'Tsams'
    ]
    stackGroups: ['AC','BD','FG','HI']
    sections: []
    trackVisibility: true
    onResize: ->
  constructor: (props)->
    super props

  render: ->
    console.log "Rendering section panel"


    hc = "handle"
    if @props.activeMode == 'skeleton'
      hc += " skeletal"
    if @props.zoom < 0.5
      hc += " zoomed-out"
    if @props.zoom < 0.1
      hc += " zoomed-way-out"

    {onResize, zoom} = @props
    style = {zoom}
    h Measure, {bounds: true, onResize}, ({measureRef})=>
      h "div#section-page-inner", {className: hc, ref: measureRef, style}, @props.children

module.exports = {SectionPanel,LocationGroup, SectionColumn}
