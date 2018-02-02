{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
VisibilitySensor = require 'react-visibility-sensor'
{SectionOverlay} = require './overlay'
SectionImages = require './images'
NotesColumn = require './notes'
Measure = require('react-measure').default
{BaseSectionComponent} = require './base'
require './main.styl'
{Intent} = require '@blueprintjs/core'
{Notification} = require '../../notify'
d3 = require 'd3'

class SectionComponent extends BaseSectionComponent
  @defaultProps: {
    BaseSectionComponent.defaultProps...
    visible: false
    trackVisibility: true
    innerWidth: 250
    offsetTop: null
    height: 100 # Section height in meters
    lithologyWidth: 40
    logWidth: 450
    containerWidth: 1000
    showSymbols: true
    showNotes: true
    showFacies: false
    isEditable: false
    useRelativePositioning: true
    padding:
      left: 100
      top: 30
      right: 0
      bottom: 30
  }
  constructor: (props)->
    super props
    @state =
      visible: not @props.trackVisibility
      scale: d3.scaleLinear().domain(@props.range)
      naturalHeight: d3.sum(@props.imageFiles, (d)->d.height)

  render: ->
    {id, zoom, scrollToHeight} = @props

    innerHeight = @props.height*@props.pixelsPerMeter*@props.zoom

    if scrollToHeight?
      scrollTop = @state.scale.invert(scrollToHeight)

    padding = {}
    for k,v of @props.padding
      if k == 'left' or k == 'bottom'
        padding[k] = @props.padding[k]
      else
        padding[k] = @props.padding[k]*@props.zoom

    {left, top, right, bottom} = padding

    scaleFactor = @props.scaleFactor/@props.pixelsPerMeter
    extraSpace = if zoom > 0.5 then 2.5*zoom else 0#@state.naturalHeight/innerHeight

    @state.scale.range [innerHeight, 0]
    outerHeight = innerHeight+(top+bottom)
    innerWidth = @props.innerWidth*@props.zoom
    if innerWidth < @props.lithologyWidth
      innerWidth = @props.lithologyWidth

    outerWidth = innerWidth+(left+right)

    {heightOfTop, showFacies} = @props
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

    innerElements = []

    if @state.visible
      {showSymbols, isEditable} = @props
      _ = h SectionOverlay, {
        id
        height: @props.height
        range: @props.range
        padding
        ticks: nticks
        innerHeight
        outerHeight
        innerWidth
        outerWidth
        isEditable
        scale
        skeletal
        showSymbols
        zoom
        showFacies
        lithologyWidth: @props.lithologyWidth
        showGeneralizedSections: @props.activeDisplayMode == 'generalized'
        showCarbonIsotopes: @props.showCarbonIsotopes
        showFloodingSurfaces: @props.showFloodingSurfaces
      }
      innerElements.push _

    if @props.zoom > 0.25 and @state.visible
      img = h SectionImages, {
        padding
        lithologyWidth: @props.lithologyWidth
        imageFiles: @props.imageFiles
        scaleFactor
        extraSpace
        skeletal: skeletal or @props.activeDisplayMode != 'image'
        zoom
      }
      innerElements.push img

    style = {
      width: outerWidth
      height: outerHeight
    }

    notesEl = null
    if @props.showNotes and @props.zoom > 0.50
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

    children = null
    props =
    children= [
      h 'div.section-header', [h "h2", txt]
      h Measure, {
        bounds: true
        onResize: @onResize
      }, ({measureRef})=>
        h 'div.section-outer', [
            h 'div.section', {
              style, ref: measureRef,
              onClick: @onClick
            }, innerElements
            notesEl
        ]
    ]

    width = outerWidth
    style = {top: marginTop}
    mainElement = h "div.section-container", {
        className: if @props.skeletal then "skeleton" else null
      },
      children

    return mainElement unless @props.trackVisibility

    p =
      onChange: @onVisibilityChange
      partialVisibility: true

    h VisibilitySensor, p, [mainElement]

  log: ->

  onVisibilityChange: (isVisible)=>
    return if isVisible == @state.visible
    console.log "Section visibility changed"
    @setState visible: isVisible

    # I'm not sure why this works but it does

  onClick: (event)=>
    fmt = d3.format('.1f')
    {scale} = @state
    {top} = event.target.getBoundingClientRect()
    {clientY} = event
    height = scale.invert(clientY-top)
    Notification.show {
      message: "#{fmt(height)} m"
      timeout: 2000
    }

module.exports = {SectionComponent}
