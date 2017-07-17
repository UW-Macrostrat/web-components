{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
VisibilitySensor = require 'react-visibility-sensor'
LithologyColumn = require './lithology'
SectionOverlay = require './overlay'
SectionImages = require './images'
NotesColumn = require './notes'
require './main.styl'

class SectionComponent extends Component
  @defaultProps: {
    zoom: 1
    visible: false
    innerWidth: 280
    height: 100 # Section height in meters
    lithologyWidth: 40
    logWidth: 400
    pixelsPerMeter: 20
    containerWidth: 1000
    skeletal: false
    showNotes: true
    padding:
      left: 60
      top: 30
      right: 30
      bottom: 30
  }
  constructor: (props)->
    super props
    @state =
      visible: false
      scale: d3.scaleLinear().domain(@props.range)
      naturalHeight: d3.sum(@props.imageFiles, (d)->d.height)

  render: ->
    {left, top, right, bottom} = @props.padding
    innerHeight = @props.height*@props.pixelsPerMeter*@props.zoom

    # 8.1522
    scaleFactor = @state.naturalHeight/innerHeight

    @state.scale.range [innerHeight, 0]
    outerHeight = innerHeight+(top+bottom)*@props.zoom
    innerWidth = @props.innerWidth*@props.zoom
    outerWidth = innerWidth+left+right

    heightOfTop = 700-@props.height-parseFloat(@props.offset)
    marginTop = heightOfTop*@props.pixelsPerMeter*@props.zoom

    style = {
      width: outerWidth
      height: outerHeight
    }

    p =
      onChange: @onVisibilityChange
      partialVisibility: true

    id = @props.id
    # Set text of header for appropriate zoom level
    txt = if @props.zoom > 0.5 then "Section " else ""
    txt += id

    scale = @state.scale
    zoom = @props.zoom

    padding = {}
    for k,v of @props.padding
      padding[k] = @props.padding[k]*@props.zoom

    {skeletal} = @props

    # Set up number of ticks
    nticks = (@props.height*@props.zoom)/10

    outerElements = [
      h 'div.section', {style}, [
        h LithologyColumn, {
          style:
            height: innerHeight
            width: @props.lithologyWidth
            top: padding.top
            left: padding.left
          skeletal
        }
        h SectionOverlay, {
          id
          height: @props.height
          range: @props.range
          padding
          lithologyWidth: @props.lithologyWidth
          ticks: nticks
          innerHeight
          outerHeight
          innerWidth
          outerWidth
          scale
          skeletal
        }
        h SectionImages, {
          padding
          lithologyWidth: @props.lithologyWidth
          imageFiles: @props.imageFiles
          scaleFactor
          skeletal
        }
      ]
    ]

    if @props.showNotes and @props.zoom > 0.5
      outerElements.push(
        h NotesColumn, {id,scale, width: @props.logWidth, zoom}
        h NotesColumn, {id,scale, width: @props.logWidth, type: 'meta-notes', zoom}
      )

    children = null
    if @state.visible
      children= [
        h 'div.section-header', [h "h2", txt]
        h 'div.section-outer', outerElements
      ]

    h VisibilitySensor, p, [
      h "div.section-container",
        className: if @props.skeletal then "skeleton" else null
        style:
          minWidth: @computeWidth()
          paddingTop: marginTop
        children
    ]

  computeWidth: =>
    if @props.showNotes
      width = @props.containerWidth
    else
      width = @props.innerWidth+30
    width *= @props.zoom
    return width

  onVisibilityChange: (isVisible)=>
    return if isVisible == @state.visible
    console.log "Section visibility changed"
    @setState visible: isVisible

    # I'm not sure why this works but it does
    window.dispatchEvent(new Event('resize'))

module.exports = SectionComponent
