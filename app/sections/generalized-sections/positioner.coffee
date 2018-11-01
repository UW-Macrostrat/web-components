{SectionPositioner, SectionScale} = require '../summary-sections/positioner'

class GeneralizedSectionPositioner extends SectionPositioner
  update: (sections)->
    groupedSections = []
    @sectionPositionsIndex = {}
    xPosition = @props.marginLeft
    sectionPositionsIndex = {}
    for section in sections
      groupWidth = 0

      col = [section]
      # Column x position
      col.position = {x: groupWidth, width: @props.columnWidth}
      col.forEach @updateSingleSection(xPosition+groupWidth)
      groupWidth += @props.columnWidth + @props.columnMargin

      groupWidth -= @props.columnMargin
      group = {
        columns: [col]
        position: {x: xPosition, width: groupWidth}
      }
      groupedSections.push group
      xPosition += groupWidth+@props.groupMargin

    xPosition -= @props.groupMargin
    groupedSections.position = {x: 0, y: 0, width: xPosition}
    # Hack to create index of section positions
    groupedSections.index = @sectionPositionsIndex
    return groupedSections

module.exports = {GeneralizedSectionPositioner}
