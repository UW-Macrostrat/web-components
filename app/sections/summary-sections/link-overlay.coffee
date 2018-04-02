{Component, createContext} = require 'react'
h = require 'react-hyperscript'
classNames = require 'classnames'
{query} = require '../../db'
d3 = require 'd3'
{Notification} = require '../../notify'

class SectionLinkOverlay extends Component
  @defaultProps: {
    width: 100
    height: 100
    paddingLeft: 20
    marginTop: 0
    showLithostratigraphy: true
    showCarbonIsotopes: false
  }
  constructor: (props)->
    super props

    @link = d3.linkHorizontal()
      .x (d)->d.x
      .y (d)->d.y

  buildLink: (surface)=>
    {sectionPositions, paddingLeft, marginTop,
     showLithostratigraphy, showSequenceStratigraphy} = @props
    {section_height, unit_commonality, type, flooding_surface_order, note} = surface

    values = [section_height...]
    #if showCarbonIsotopes
    #v = section_height.find (d)->d.section == 'J'
    #if v?
      #{section, rest...} = v
      #values.push {section: 'carbon-isotopes', rest...}

    if type == 'lithostrat'
      stroke = '#ccc'
      if not showLithostratigraphy
        return null
    if type == 'sequence-strat'
      stroke = if flooding_surface_order > 0 then '#888' else '#f88'
      strokeWidth = 6-Math.abs(flooding_surface_order)
      if not showSequenceStratigraphy
        return null

    if note?
      onClick = ->
        Notification.show {
          message: note
        }
    else
      onClick = null

    heights = []
    for {section, height, inferred} in values
      try
        {bounds, padding, scale} = sectionPositions[section]
      catch
        # Not positioned yet (or at all?)
        continue
      yOffs = scale(height)
      y = bounds.top+padding.top+yOffs-marginTop
      heights.push {x0: bounds.left+40, x1: bounds.left+bounds.width, y, inferred}

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
    console.log "Rendering overlay", sectionPositions

    className = classNames {skeletal}

    __ = []
    for key, {bounds, padding} of sectionPositions
      {left, top, width, height} = bounds
      x = left
      y = top+padding.top-marginTop
      width -= (padding.left+padding.right)
      height -= (padding.top+padding.bottom)
      __.push h 'rect.section-tracker', {key, x,y,width, height}

    {width, height} = @props
    style = {top: marginTop}
    h 'svg#section-link-overlay', {className, width, height, style}, [
      h 'g.section-trackers', __
      h 'g.section-links', surfaces.map @buildLink
    ]

module.exports = {SectionLinkOverlay}

