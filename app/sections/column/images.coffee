{Component, createElement} = require 'react'
{findDOMNode} = require 'react-dom'
d3 = require 'd3'

class SectionImages extends Component
  @defaultProps:
    skeletal: false
  render: ->
    height = d3.sum @props.imageFiles, (d)->d.height
    style =
      "paddingTop": @props.padding.top
      "paddingLeft": @props.padding.left+@props.lithologyWidth
    if @props.skeletal
      children = []
    else
      children = @props.imageFiles.map (im)=>
        h "img",
          src: im.filename
          width: im.width/@props.scaleFactor
          height: im.height/@props.scaleFactor
    h "div.images", {style}, children

module.exports = SectionImages
