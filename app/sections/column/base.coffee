import {findDOMNode} from "react-dom"
import d3 from "d3"
import "d3-selection-multi"
import {Component, createElement} from "react"
import h from "react-hyperscript"
import "./main.styl"
import {query} from "../db"
import {KnownSizeComponent} from "../util"

class BaseSectionComponent extends KnownSizeComponent
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
    {divisions} = @props
    if not divisions?
      divisions = []
      query 'lithology', [@props.id]
        .then (divisions)=>@setState {divisions}

    @state = {divisions}

  __doUpdate: ->
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

export {BaseSectionComponent}
