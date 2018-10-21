{Component, createContext} = require 'react'
h = require 'react-hyperscript'
classNames = require 'classnames'
d3 = require 'd3'
{SVGNamespaces} = require '../util'
{Notification} = require '../../notify'
{SectionOptionsContext} = require './options'
PropTypes = require 'prop-types'

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

ZeroPadding = {left: 0, right: 0, top: 0, bottom: 0}

class SectionTrackers extends Component
  render: ->
    {sectionPositions} = @props
    h 'g.section-trackers', sectionPositions.map (d)->
      h 'rect.section-tracker', d

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
    {paddingLeft, marginTop,
     showLithostratigraphy, showSequenceStratigraphy
     showCarbonIsotopes, groupedSections} = @props
    {section_height, surface_id, unit_commonality,
     type, flooding_surface_order, note} = surface

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

    onClick = ->
      v = if type == 'lithostrat' then "Lithostratigraphic" else "Sequence-stratigraphic"
      Notification.show {
        message: h 'div', [
          "#{v} surface "
          h 'code', surface_id
          if note? then ": #{note}" else null
        ]
      }

    heights = []
    for {section, height, inferred, inDomain} in values
      try
        {position} = groupedSections.index[section]
        scale = position.heightScale.global
        {width, x: x0} = position
        x1 = x0+width
        y = scale(height)

      catch
        # Not positioned yet (or at all?)
        console.log "Couldn't position section #{section}"

      heights.push {x0, x1, y, inferred, inDomain}

    heights.sort (a,b)-> a.x0 - b.x0

    return null if heights.length < 2

    pathData = d3.pairs heights, (a,b)->
      inferred = (a.inferred or b.inferred)
      source = {x: a.x1, y: a.y}
      target = {x: b.x0, y: b.y}
      {inDomain} = b
      width = b.x1-b.x0
      {source, target, inferred, width}

    isFirst = true
    links = for pair in pathData
      unit_commonality ?= 0
      {inferred,width} = pair
      className = classNames(
        "section-link"
        "commonality-#{unit_commonality}"
        type
        {inferred})
      d = ""
      if isFirst
        # Could probably replace this with a particular thing
        {x,y} = pair.source
        d += "M#{x-width},#{y}l#{width},0"
        isFirst = false
      d += @link(pair)
      d += "l#{width},0"
      fill = 'none'

      h 'path', {d, className, stroke, strokeWidth, fill, onClick}

    h 'g', links

  prepareData: ->
    {skeletal, groupedSections, marginTop,
     showLithostratigraphy, surfaces} = @props
    return null unless surfaces.length
    {triangleBarsOffset} = @props.sectionOptions

    sectionIndex = groupedSections.index

    ## Deconflict surfaces
    ## The below is a fairly complex way to make sure multiple surfaces
    ## aren't connected in the same stack.
    sectionSurfaces = {}
    for {surface_id, section_height} in surfaces
      continue unless surface_id? # weed out lithostratigraphy for now
      for {section, height, inferred} in section_height
        sectionSurfaces[section] ?= []
        sectionSurfaces[section].push {surface_id, height, inferred}

    # Backdoor way to get section stacks
    sectionStacks = d3.nest()
      .key (d)->d.position.x
      .entries (v for k,v of sectionIndex)

    stackSurfaces = []
    for {key, values: stackedSections} in sectionStacks
      surfacesIndex = {}
      # Logic for determining which section's surface is rendered
      # within a stack (typically the section that is not inferred)

      for section in stackedSections
        {id: section_id} = section
        section_surfaces = sectionSurfaces[section_id]
        # Define a function to return domain
        withinDomain = (height)->
          {position} = sectionIndex[section.id]
          scale = position.heightScale.global
          d = scale.domain()
          return d[0] < height < d[1]

        # Naive logic
        for surface in section_surfaces
          s1 = surfacesIndex[surface.surface_id]
          if s1?
            # We already have a surface defined
            if withinDomain(s1.height)
              if s1.inferred and not section.inferred
                continue
            if not withinDomain(surface.height)
              continue
          surfacesIndex[surface.surface_id] = {section: section_id, surface...}
      # Convert to an array
      surfacesIndex = (v for k,v of surfacesIndex)
      # Add the pixel height
      for surface in surfacesIndex
        {position} = sectionIndex[surface.section]
        scale = position.heightScale.global
        surface.y = scale(surface.height)
        surface.inDomain = withinDomain(surface.height)

      # Save generated index to appropriate stack
      stackSurfaces.push {
        x: parseFloat(key)
        values: surfacesIndex
      }

    # Turn back into surface-oriented list
    return surfaces.map (s)->
      id = s.surface_id
      v = {s...}
      return v unless id?
      heights = []
      for {values} in stackSurfaces
        val = values.find (d)->id == d.surface_id
        heights.push(val) if val?
      v.section_height = heights
      return v

  render: ->
    {skeletal, sectionPositions, marginTop,
     showLithostratigraphy, surfaces, groupedSections} = @props
    return null unless surfaces.length
    {triangleBarsOffset} = @props.sectionOptions

    className = classNames {skeletal}

    for key, {bounds, padding} of sectionPositions
      {left, top, width, height} = bounds
      sectionPositions[key].key = key
      continue unless left?
      x = left+triangleBarsOffset
      y = top+padding.top-marginTop
      width -= (padding.left+padding.right)
      height -= (padding.top+padding.bottom)

    surfacesNew = @prepareData()


    # Compute the position of sections by index
    # This could be moved to a context instance probably
    ix = ({id: k, v.position...} for k,v of groupedSections.index)

    {width, height} = @props
    style = {top: marginTop}
    h 'svg#section-link-overlay', {
      SVGNamespaces...
      className, width, height, style}, [
      h SectionTrackers, {sectionPositions: ix}
      h 'g.section-links', surfacesNew.map @buildLink
    ]

class SectionLinkHOC extends Component
  render: ->
    h SectionOptionsContext.Consumer, null, (sectionOptions)=>
      h SectionLinkOverlay, {sectionOptions, @props...}

module.exports = {
  SectionLinkOverlay: SectionLinkHOC
  LinkOverlayBase: SectionLinkOverlay
  sectionSurfaceProps
}

