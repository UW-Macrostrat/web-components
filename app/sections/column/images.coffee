import {Component, createElement} from "react"
import {findDOMNode} from "react-dom"
import * as d3 from "d3"
import h from "react-hyperscript"
import T from "prop-types"
import {ColumnContext} from "./context"

class SectionImages extends Component
  @defaultProps: {
    skeletal: false
    extraSpace: 0
  }
  @propTypes: {
    imageFiles: T.arrayOf(T.object)
  }
  @contextType: ColumnContext
  render: ->
    {zoom} = @context
    {scaleFactor, imageFiles} = @props
    n = imageFiles.length
    height = d3.sum imageFiles, (d)->d.height
    width = d3.max imageFiles, (d)->d.width
    zs = zoom/scaleFactor
    style = {
      marginTop: @props.padding.top+@props.extraSpace
      marginLeft: @props.padding.left+@props.lithologyWidth
      height: height*zs
      width: width*zs
      position: 'relative'
    }
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

export default SectionImages
