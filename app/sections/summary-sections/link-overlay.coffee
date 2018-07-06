{Component, createContext} = require 'react'
h = require 'react-hyperscript'
classNames = require 'classnames'
d3 = require 'd3'
{SVGNamespaces} = require '../util'
{Notification} = require '../../notify'
{SectionOptionsContext} = require './options'

sectionSurfaceProps = (surface)->
    {flooding_surface_order} = surface
    stroke = if flooding_surface_order > 0 then '#aaa' else '#faa'
    strokeWidth = 6-Math.abs(flooding_surface_order)
    return {stroke, strokeWidth}

OverlayContext = createContext {
  sectionPositions: []
  onResize: ->
}

# https://www.particleincell.com/2012/bezier-splines/

class SectionLinkOverlay extends Component
  @defaultProps: {
    width: 100
    height: 100
    paddingLeft: 20
    marginTop: 0
    showLithostratigraphy: true
    showCarbonIsotopes: false
    sectionOptions: {}
  }
  constructor: (props)->
    super props

    @link = d3.linkHorizontal()
      .x (d)->d.x
      .y (d)->d.y

  buildLink: (surface)=>
    {sectionPositions, paddingLeft, marginTop,
     showLithostratigraphy, showSequenceStratigraphy
     showCarbonIsotopes} = @props
    {section_height, unit_commonality, type, flooding_surface_order, note} = surface

    values = [section_height...]
    if showCarbonIsotopes
      v = section_height.find (d)->d.section == 'J'
      if v?
        {section, rest...} = v
        values.push {section: 'carbon-isotopes', rest...}

    if type == 'lithostrat'
      stroke = '#ccc'
      if not showLithostratigraphy
        return null
    if type == 'sequence-strat'
      {stroke, strokeWidth} = sectionSurfaceProps(surface)
      if not showSequenceStratigraphy
        return null

    if note?
      onClick = ->
        Notification.show {
          message: note
        }
    else
      onClick = null

    {triangleBarsOffset, width} = @props.sectionOptions
    heights = []
    for {section, height, inferred} in values
      try
        {bounds, padding, scale, pixelOffset
         triangleBarRightSide
         triangleBarsOffset} = sectionPositions[section]
        triangleBarRightSide ?= false
      catch
        # Not positioned yet (or at all?)
        continue
      yOffs = scale(height)+pixelOffset+2
      y = yOffs
      {left: x0, width} = bounds
      x0 += 55
      x1 = x0+width-40
      ofs = triangleBarsOffset - 10
      if triangleBarRightSide
        x0 -= ofs
        x1 -= ofs


      heights.push {x0, x1, y, inferred}

    heights.sort (a,b)-> a.x0 - b.x0

    return null if heights.length < 2

    pathData = d3.pairs heights, (a,b)->
      inferred = (a.inferred or b.inferred)
      source = {x: a.x1, y: a.y}
      target = {x: b.x0, y: b.y}
      {source, target, inferred}

    links = for pair in pathData
      {inferred} = pair
      className = classNames(
        "section-link"
        "commonality-#{unit_commonality}"
        type
        {inferred})
      d = @link(pair)
      h 'path', {d, className, stroke, strokeWidth, onClick}

    h 'g', links

  render: ->
    {skeletal, sectionPositions, marginTop, showLithostratigraphy, surfaces} = @props

    className = classNames {skeletal}

    __ = []
    for key, {offset, padding} of sectionPositions
      {left, top, width, height} = offset
      continue unless left?
      x = left
      y = top+padding.top-marginTop
      width -= (padding.left+padding.right)
      height -= (padding.top+padding.bottom)
      __.push h 'rect.section-tracker', {key, x,y,width, height}

    {width, height} = @props
    style = {top: marginTop}
    h 'svg#section-link-overlay', {
      SVGNamespaces...
      className, width, height, style}, [
      h 'g.section-trackers', __
      h 'g.section-links', surfaces.map @buildLink
    ]

class SectionLinkHOC extends Component
  render: ->
    h SectionOptionsContext.Consumer, null, (sectionOptions)=>
      h SectionLinkOverlay, {sectionOptions, @props...}

module.exports = {SectionLinkOverlay: SectionLinkHOC, sectionSurfaceProps}

