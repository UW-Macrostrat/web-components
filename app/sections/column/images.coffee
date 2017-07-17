{Component, createElement} = require 'react'
{findDOMNode} = require 'react-dom'
d3 = require 'd3'
h = require 'react-hyperscript'

class SectionImages extends Component
  @defaultProps:
    skeletal: false
  render: ->
    height = d3.sum @props.imageFiles, (d)->d.height
    width = d3.max @props.imageFiles, (d)->d.width
    style =
      marginTop: @props.padding.top
      marginLeft: @props.padding.left+@props.lithologyWidth
      height: height/@props.scaleFactor
      width: width/@props.scaleFactor
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
