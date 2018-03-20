{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
require './main.styl'
{query} = require '../db'

class BaseSectionComponent extends Component
  @defaultProps: {
    zoom: 1
    pixelsPerMeter: 20
    skeletal: false
    offset: 0
    offsetTop: null
    useRelativePositioning: true
    showTriangleBars: false
  }
  constructor: (props)->
    super props
    @state = {
      divisions: []
    }
    query 'lithology', [@props.id]
      .then (divisions)=>@setState {divisions}

  componentDidMount: ->
    @componentDidUpdate.apply @, arguments

  onResize: ({bounds})=>
    {scale} = @state
    {padding, onResize} = @props
    return unless onResize?
    onResize {scale, bounds, padding}

  componentDidUpdate: ->
    # This leads to some problems unsurprisingly
    el = findDOMNode @

    {scale} = @state
    {height, zoom, offset, offsetTop} = @props
    pixelsPerMeter = Math.abs(scale(1)-scale(0))

    # If we're not moving sections from the top, don't mess with positioning
    # at runtime
    return unless @props.useRelativePositioning

    offsetTop ?= 670-height-offset
    heightOfTop = offsetTop
    desiredPosition = heightOfTop*pixelsPerMeter

    # Set alignment
    offs = 0
    sib = el.previousSibling
    if sib?
      {top} = el.parentElement.getBoundingClientRect()
      {bottom} = sib.getBoundingClientRect()
      offs = bottom-top

    el.style.marginTop = "#{desiredPosition-offs}px"

module.exports = {BaseSectionComponent}
