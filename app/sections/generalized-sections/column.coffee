d3 = require 'd3'
require 'd3-selection-multi'
h = require 'react-hyperscript'
{findDOMNode} = require 'react-dom'
Measure = require('react-measure').default
{Component, createElement, createRef} = require 'react'

{BaseSVGSectionComponent} = require '../summary-sections/column'
{SectionAxis} = require '../column/axis'
{GeneralizedSectionColumn, FaciesColumn} = require '../column/lithology'
{FaciesContext} = require '../facies-descriptions'
{SVGNamespaces} = require '../util'

class GeneralizedSVGSection extends Component
  @defaultProps: {pixelsPerMeter: 20, zoom: 1}
  constructor: (props)->
    super props

  render: ->
    {id,
     showFacies,
     divisions,
     position} = @props

    {x: left, y: top, width, height, heightScale} = position

    scale = heightScale.local

    divisions = divisions.filter (d)->not d.schematic

    transform = "translate(#{left} #{top})"

    h "g.section", {transform, key: id}, [
      h FaciesContext.Consumer, {}, ({facies})=>
        h FaciesColumn, {
          width
          height
          facies
          divisions
          showFacies
          scale
          id
        }
    ]

module.exports = {GeneralizedSVGSection}
