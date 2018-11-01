{SectionPositioner, SectionScale} = require '../summary-sections/positioner'

class GeneralizedSectionPositioner extends SectionPositioner
  update: (sections)->
    {positions, scaleMultipliers} = @props
    groupedSections = []
    @sectionPositionsIndex = {}
    scaleMultipliers ?= {}
    scaleMultipliers.x ?= 1
    scaleMultipliers.y ?= 1

    for section in sections
      # Get section position from a global store
      {x,y} = positions[section.id]
      width = @props.columnWidth

      section.offset = y*scaleMultipliers.y+@props.marginTop
      # Column x position
      v = x*scaleMultipliers.x+@props.marginLeft
      section = @updateSingleSection(v)(section)

      col = [section]
      col.position = section.position

      groupedSections.push  {
        columns: [col]
        position: col.position
      }

    groupedSections.position = @getOverallPosition(groupedSections)
    # Hack to create index of section positions
    groupedSections.index = @sectionPositionsIndex
    console.log groupedSections
    return groupedSections

module.exports = {GeneralizedSectionPositioner}
