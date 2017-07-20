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
    trackVisibility: true
    innerWidth: 280
    height: 100 # Section height in meters
    lithologyWidth: 40
    logWidth: 350
    pixelsPerMeter: 20
    containerWidth: 1000
    skeletal: false
    showNotes: true
    padding:
      left: 100
      top: 30
      right: 30
      bottom: 30
  }
  constructor: (props)->
    super props
    @state =
      visible: not @props.trackVisibility
      scale: d3.scaleLinear().domain(@props.range)
      naturalHeight: d3.sum(@props.imageFiles, (d)->d.height)

  render: ->
    {id, zoom} = @props

    innerHeight = @props.height*@props.pixelsPerMeter*@props.zoom

    padding = {}
    for k,v of @props.padding
      padding[k] = @props.padding[k]
      unless k == 'left'
        padding[k] *= @props.zoom

    {left, top, right, bottom} = padding
    # 8.1522
    # 8.138565
    # 8.1565
    scaleFactor = 8.157
    extraSpace = 2.5*zoom #@state.naturalHeight/innerHeight

    @state.scale.range [innerHeight, 0]
    outerHeight = innerHeight+(top+bottom)
    innerWidth = @props.innerWidth*@props.zoom
    outerWidth = innerWidth+(left+right)

    heightOfTop = 670-@props.height-parseFloat(@props.offset)
    marginTop = heightOfTop*@props.pixelsPerMeter*@props.zoom

    [bottom,top] = @props.range

    @log "Section #{id}"
    @log "Images are #{@state.naturalHeight} pixels high"
    @log "Height of section: #{top-bottom} m, #{innerHeight} px"
    @log "Natural scale of section images: #{@state.naturalHeight/(top-bottom)} px/m"
    @log "Scale height: #{@state.scale(1)-@state.scale(0)} px/m"
    @log "Forced scale factor: #{scaleFactor*@props.pixelsPerMeter}"
    fn = (v, d)-> v+" #{d.width} px,"
    @log @props.imageFiles.reduce(fn, "Width of images: ")

    # Set text of header for appropriate zoom level
    txt = if @props.zoom > 0.5 then "Section " else ""
    txt += id

    {scale,visible} = @state
    zoom = @props.zoom

    {skeletal} = @props

    # Set up number of ticks
    nticks = (@props.height*@props.zoom)/10


    innerElements = [
      h LithologyColumn, {
        style:
          height: innerHeight
          width: @props.lithologyWidth
          top: padding.top
          left: padding.left
        id
        scale
        skeletal
        zoom
        visible
      }
    ]

    if @state.visible
      _ = h SectionOverlay, {
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
        zoom
      }
      innerElements.push _


    if @props.zoom > 0.25 and @state.visible
      img = h SectionImages, {
        padding
        lithologyWidth: @props.lithologyWidth
        imageFiles: @props.imageFiles
        scaleFactor: scaleFactor
        extraSpace: extraSpace
        skeletal
        zoom
      }
      innerElements.push img

    style = {
      width: outerWidth
      height: outerHeight
      marginLeft: -100
    }

    notesEl = null
    if @props.showNotes
      if @props.zoom > 0.5 and visible
        # Notes column manages zoom on its own
        notesEl = h NotesColumn, {
          id
          visible
          sectionLimits: @props.range
          height: innerHeight*zoom
          width: @props.logWidth*zoom
          zoom,
          marginTop: @props.padding.top
        }
      else
        notesEl = h 'div.notes-placeholder',
          style: {
            height: innerHeight*zoom
            width: @props.logWidth*zoom
            marginTop: @props.padding.top
          }

    children = null
    children= [
      h 'div.section-header', [h "h2", txt]
      h 'div.section-outer', [
        h 'div.section', {style}, innerElements
        notesEl
      ]
    ]

    width = outerWidth
    style = {top: marginTop}
    mainElement = h "div.section-container",
      className: if @props.skeletal then "skeleton" else null
      style:
        minWidth: width
      children

    return mainElement unless @props.trackVisibility

    p =
      onChange: @onVisibilityChange
      partialVisibility: true

    h VisibilitySensor, p, [mainElement]

  log: ->

  componentDidMount: ->
    @componentDidUpdate.apply @, arguments

  componentDidUpdate: ->
    # This leads to some problems unsurprisingly
    el = findDOMNode @

    {scale} = @state
    {height, zoom, offset} = @props
    pixelsPerMeter = Math.abs(scale(1)-scale(0))

    heightOfTop = 670-height-offset
    console.log "Section #{@props.id}: offset #{heightOfTop} m"
    desiredPosition = heightOfTop*pixelsPerMeter*zoom
    offs = 0

    sib = el.previousSibling
    if sib?
      {top} = el.parentElement.getBoundingClientRect()
      {bottom} = sib.getBoundingClientRect()
      offs = bottom-top
    el.style.marginTop = "#{desiredPosition-offs}px"

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

module.exports = SectionComponent
