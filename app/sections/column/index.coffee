{findDOMNode} = require 'react-dom'
d3 = require 'd3'
require 'd3-selection-multi'
{Component, createElement} = require 'react'
h = require 'react-hyperscript'
VisibilitySensor = require 'react-visibility-sensor'
createLithologyColumn = require 'stratigraphic-column/src/lithology'
createGrainsizeScale = require 'stratigraphic-column/src/grainsize'

NotesColumn = require './notes'

require './main.styl'

class SectionImages extends Component
  render: ->
    height = d3.sum @props.imageFiles, (d)->d.height
    style =
      "paddingTop": @props.padding.top
      "paddingLeft": @props.padding.left+@props.lithologyWidth
    h "div.images", {style}, @props.imageFiles.map (im)=>
      h "img",
        src: im.filename
        width: im.width/@props.scaleFactor
        height: im.height/@props.scaleFactor

class SectionOverlay extends Component
  @defaultProps:
    padding: 30
  constructor: (props)->
    super props
    @state = lithologyData: null

  render: ->
    h "svg.overlay", style: {
      width: @props.outerWidth
      height: @props.outerHeight
    }
  componentDidMount: ->
    _el = findDOMNode @
    el = d3.select _el

    @backdrop = el.append 'g'
      .attrs class: 'backdrop'

    @createAxes()
    @createLithologyColumn()

  createAxisLines: =>
    g = @backdrop.append 'g'
      .attrs class: 'y graticule'

    r = @props.range
    g.selectAll 'line'
      .data [r[0]..r[1]]
      .enter()
        .append('line')
        .attrs (d)=>
          y = @props.scale(d)
          {x1: 0, x2: @props.innerWidth, y1: y, y2: y}

  createAxes: =>
    yAxis = d3.axisLeft()
      .scale(@props.scale)
      .ticks(@props.height//10)

    @backdrop
      .attr 'transform', "translate(#{@props.padding.left} #{@props.padding.top})"

    @backdrop.append 'g'
      .attrs class: 'y axis'
      .call yAxis

    @x = d3.scaleLinear()
      .domain [0,14] #blocks
      .range [0,@props.innerWidth]

    g = @backdrop.append 'g'
    createGrainsizeScale g.node(),
      scale: @props.scale
      height: @props.innerHeight
      range: [118,198]

  createLithologyColumn: =>

    defs = @backdrop
      .append 'defs'

    defs.append 'rect'
      .attrs
        id: 'lithology-column'
        height: @props.innerHeight
        width: @props.lithologyWidth
        x: @x(0)
        y: 0

    defs.append 'clipPath'
      .attrs
        id: 'lithology-clip'
      .append 'use'
        .attrs href: '#lithology-column'

    lith = @backdrop.append 'g'
      .attrs class: 'dominant-lithology'

    el = lith.append 'g'
      .attrs
        class: 'container'
        'clip-path': "url(#lithology-clip)"

    createLithologyColumn el,
      id: @props.id
      width: @props.lithologyWidth
      scale: @props.scale

    lith.append 'use'
      .attrs
        class: 'neatline'
        href: '#lithology-column'

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
    innerHeight = @props.height*@props.pixelsPerMeter

    @state.scaleFactor =  8.1522#@state.naturalHeight/innerHeight

    @state.scale.range [innerHeight, 0]
    outerHeight = innerHeight+top+bottom
    innerWidth = @props.innerWidth
    outerWidth = innerWidth+left+right

    style =
      width: outerWidth
      height: outerHeight
      #zoom: @props.zoom

    console.log @props

    p =
      onChange: @onVisibilityChange
      partialVisibility: true

    id = @props.id
    # Set text of header for appropriate zoom level
    txt = if @props.zoom > 0.5 then "Section " else ""
    txt += id

    scale = @state.scale
    zoom = @props.zoom

    sectionInnerElements = =>
      if @props.skeletal
        return [ h 'div.section-column', style: {padding: @props.padding, height: @props.innerHeight} ]
      else
        return [
          h SectionOverlay, {
            id
            height: @props.height
            range: @props.range
            padding: @props.padding
            lithologyWidth: @props.lithologyWidth
            innerHeight
            outerHeight
            innerWidth
            outerWidth
            scale
          }
          h SectionImages, {
            padding: @props.padding
            lithologyWidth: @props.lithologyWidth
            scaleFactor: @state.scaleFactor
            imageFiles: @props.imageFiles
          }
        ]

    outerElements = [
      h 'div.section', {style}, sectionInnerElements()
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
          height: (outerHeight+30)*@props.zoom
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

module.exports = SectionComponent
