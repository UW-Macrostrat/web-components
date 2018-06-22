{Component} = require 'react'

class SectionTemplate extends Component
  render: ->
    h 'div#map-root', {}, [
      h 'div#map-panel-container', {}, [
        h MapNavigationControl, {toggleLegend: @toggleLegend}
        h MapPanel
      ]
      h LegendPanel, {isActive: @state.legendIsActive}
    ]


