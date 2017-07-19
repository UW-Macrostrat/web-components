{Component, createElement} = require 'react'
{findDOMNode} = require 'react-dom'
d3 = require 'd3'
h = require 'react-hyperscript'

class SectionImages extends Component
  @defaultProps:
    skeletal: false
    extraSpace: 0
  render: ->
    {zoom, scaleFactor} = @props
    n = @props.imageFiles.length
    height = d3.sum @props.imageFiles, (d)->d.height
    width = d3.max @props.imageFiles, (d)->d.width
    zs = zoom/scaleFactor-(1-zoom)*0.0003
    console.log "Scale factor: #{zoom/zs}"
    style =
      marginTop: @props.padding.top+@props.extraSpace
      marginLeft: @props.padding.left+@props.lithologyWidth
      height: height*zs
      width: width*zs
    if @props.skeletal
      children = []
    else
      children = @props.imageFiles.map (im)=>
        h "img",
          src: im.filename
          width: im.width*zs
          height: im.height*zs
    h "div.images", {style}, children

module.exports = SectionImages
