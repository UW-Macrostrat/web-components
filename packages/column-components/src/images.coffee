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
    {zoom, height, pixelsPerMeter} = @context
    {imageFiles} = @props
    n = imageFiles.length
    imageHeight = d3.sum imageFiles, (d)->d.height
    imageWidth = d3.max imageFiles, (d)->d.width

    scaleFactor = imageHeight/height/pixelsPerMeter
    zs = zoom/scaleFactor
    style = {
      marginTop: @props.padding.top+@props.extraSpace
      marginLeft: @props.padding.left+@props.lithologyWidth
      height: imageHeight*zs
      width: imageWidth*zs
      position: 'relative'
    }
    if @props.skeletal
      children = []
    else
      children = imageFiles.map (im,i)=>
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
