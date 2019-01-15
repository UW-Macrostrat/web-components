d3 = require 'd3'

groupSectionData = (sections)->
  stackGroup = (d)=>
    for g in stackGroups
      if g.indexOf(d.id) != -1
        return g
    return d.id

  indexOf = (arr)->(d)->
    arr.indexOf(d)

  __ix = indexOf(stackGroups)

  sectionGroups = d3.nest()
    .key (d)->d.location
    .key stackGroup
    .sortKeys (a,b)->__ix(a)-__ix(b)
    .entries sections

  # Change key names to be more semantic
  for g in sectionGroups
    g.columns = g.values.map (col)->
      return col.values
    delete g.values
    g.location = g.key
    delete g.key

  __ix = indexOf(groupOrder)
  sectionGroups.sort (a,b)->__ix(a.location)-__ix(b.location)
  return sectionGroups

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
  }
  constructor: (props={})->
    @props = {}
    for k,opt of @constructor.defaultProps
      if props[k]?
        @props[k] = props[k]
      @props[k] ?= opt

  update: (groupedSections)->
    {pixelsPerMeter} = @props
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
          offset = sectionOffsets[sec.id] or offset
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
            heightScale.pixelBounds()
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

module.exports = {groupSectionData,
                  SectionScale,
                  SectionPositioner}
