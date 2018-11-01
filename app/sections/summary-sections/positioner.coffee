d3 = require 'd3'

class SectionScale
  constructor: (opts={})->
    {start,height,offset,pixelsPerMeter} = opts
    end = start + height
    range = [start, end]
    offset = parseFloat(offset)
    @props = {start, end, range, height, offset, pixelsPerMeter}
    pxOffset = @pixelOffset()
    @global = d3.scaleLinear()
      .domain(range)
      .range([@pixelHeight()+pxOffset,pxOffset])
    @local = d3.scaleLinear()
      .domain(range)
      .range([@pixelHeight(),0])

  pixelHeight: ->
    @props.height*@props.pixelsPerMeter
  pixelOffset: ->
    (670-@props.height-@props.offset)*@props.pixelsPerMeter
  pixelBounds: ->
    height = @pixelHeight()
    y = @pixelOffset()
    return {y, height}

class SectionPositioner
  ###
  # Groups sections into sets of columns
  # using a transformation
  ###
  @defaultProps: {
    marginLeft: 0
    groupMargin: 400
    columnMargin: 100
    columnWidth: 200
    pixelsPerMeter: 2
    sectionOffsets: null
  }
  constructor: (props={})->
    @props = {}
    for k,opt of @constructor.defaultProps
      if props[k]?
        @props[k] = props[k]
      @props[k] ?= opt

  update: (groupedSections)->
    {pixelsPerMeter, sectionOffsets} = @props

    sectionOffsets ?= {}
    xPosition = @props.marginLeft
    sectionPositionsIndex = {}
    for group in groupedSections
      groupWidth = 0
      for col in group.columns
        # Column x position
        col.position = {x: groupWidth, width: @props.columnWidth}
        for sec in col
          {offset, start, end} = sec

          # Heights
          offset = sectionOffsets[sec.id] or offset or 0
          sec.offset = parseFloat(offset)
          # Clip off the top of some columns...
          # (this should be more customizable)
          end = sec.clip_end
          height = end-start
          range = [start, end]
          heightScale = new SectionScale {
            pixelsPerMeter, start, height, offset
          }

          secPosition = {
            x: xPosition+groupWidth
            heightScale.pixelBounds()...
            width: @props.columnWidth
            heightScale
          }
          sec.position = secPosition
          sectionPositionsIndex[sec.id] = sec
        groupWidth += @props.columnWidth + @props.columnMargin

      groupWidth -= @props.columnMargin
      group.position = {x: xPosition, width: groupWidth}

      xPosition += groupWidth+@props.groupMargin
    xPosition -= @props.groupMargin
    groupedSections.position = {x: 0, y: 0, width: xPosition}
    # Hack to create index of section positions
    groupedSections.index = sectionPositionsIndex

    return groupedSections

module.exports = {SectionPositioner, SectionScale}
