{Component} = require 'react'
h = require 'react-hyperscript'
{CSSTransition} = require 'react-transition-group'
{MapLegendList} = require './inner'

class LegendPanel extends Component
  render: ->
    return null unless @props.isActive
    h CSSTransition, {
      classNames: "settings"
      timeout: {exit: 1000, enter: 1000}
    }, [
      h 'div#map-legend', {key: 'legend'}, [
        h 'div.legend-inner', {}, [
          h 'div.title-block', [
            h 'h1', 'Geologic map of the southern Naukluft Mountains'
            h 'p', 'Daven Quinn - Dissertation plate 4.1'
            h 'div.admonition', [
              h 'p', 'Preliminary version 4/18/2018'
              h 'p', 'Fault ticks, fold axes, bedding orientations, and unit labels are not rendered'
            ]
          ]
          h MapLegendList
        ]
      ]
    ]

module.exports = {LegendPanel}
