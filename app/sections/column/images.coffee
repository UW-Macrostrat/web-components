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
    zs = zoom/scaleFactor
    style =
      marginTop: @props.padding.top+@props.extraSpace
      marginLeft: @props.padding.left+@props.lithologyWidth
      height: height*zs
      width: width*zs
      position: 'relative'
    if @props.skeletal
      children = []
    else
      children = @props.imageFiles.map (im,i)=>
        h "img",
          src: "file://"+im.filename
          width: im.width*zs
          height: im.height*zs
          style: {
            position: 'absolute'
            top: (427*i)*zs
            left: 0
          }
    h "div.images", {style}, children

module.exports = SectionImages
