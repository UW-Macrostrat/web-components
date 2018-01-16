{findDOMNode} = require 'react-dom'
{Component} = require 'react'
{SectionNavigationControl} = require '../util'
d3 = require 'd3'
h = require 'react-hyperscript'
createVisualization = require '../../lateral-variation'

class SummarySections extends Component
  render: ->
    h 'div', [
      h SectionNavigationControl, {backLocation: '/sections'}
      h 'div.section-pane', [
      ]
    ]

module.exports = SummarySections
