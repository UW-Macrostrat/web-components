import * as d3 from "d3"

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
    @props.offset*@props.pixelsPerMeter
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
    groupMargin: 400
    columnMargin: 100
    columnWidth: 200
    pixelsPerMeter: 2
    sectionOffsets: {}
    ScaleCreator: SectionScale
  }
  constructor: (props={})->
    {margin, marginHorizontal, marginVertical} = props
    margin ?= 0
    marginVertical ?= margin
    marginHorizontal ?= margin
    props.marginTop ?= marginVertical
    props.marginBottom ?= marginVertical
    props.marginLeft ?= marginHorizontal
    props.marginRight ?= marginHorizontal
    @props = Object.assign(@constructor.defaultProps,props)

  updateSingleSection: (xPosition)=>(sec)=>
    {sectionOffsets, pixelsPerMeter} = @props
    sectionOffsets ?= {}
    {offset, start, end} = sec
    # Heights
    offset = sectionOffsets[sec.id] or offset or 0
    # Clip off the top of some columns...
    # (this should be more customizable)
    end = sec.clip_end
    height = end-start
    range = [start, end]
    heightScale = new @props.ScaleCreator {
      pixelsPerMeter, start, height, offset
    }

    secPosition = {
      x: xPosition
      heightScale.pixelBounds()...
      width: @props.columnWidth
      heightScale
    }
    sec.position = secPosition
    @sectionPositionsIndex[sec.id] = sec
    return sec

  getOverallPosition: (groupedSections)->
    [xMax,yMax] = [0,0]
    for group in groupedSections
      for column in group.columns
        for section in column
          {position} = section
          {x,y,width,height} = position
          if x+width > xMax
            xMax = x+width
          if y+height > yMax
            yMax = y+height
    width = xMax + @props.marginRight
    height = yMax + @props.marginBottom
    return {x:0,y:0, width, height}


  update: (groupedSections)->
    @sectionPositionsIndex = {}
    xPosition = @props.marginLeft
    sectionPositionsIndex = {}
    for group in groupedSections
      groupWidth = 0
      for col in group.columns
        # Column x position
        col.position = {x: groupWidth, width: @props.columnWidth}
        col.forEach @updateSingleSection(xPosition+groupWidth)
        groupWidth += @props.columnWidth + @props.columnMargin

      groupWidth -= @props.columnMargin
      group.position = {x: xPosition, width: groupWidth}

      xPosition += groupWidth+@props.groupMargin
    xPosition -= @props.groupMargin
    groupedSections.position = {x: 0, y: 0, width: xPosition}
    # Hack to create index of section positions
    groupedSections.index = @sectionPositionsIndex
    return groupedSections

export {SectionPositioner, SectionScale}
